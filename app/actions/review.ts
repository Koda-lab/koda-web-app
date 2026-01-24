"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/db";
import Review from "@/models/Review";
import Purchase from "@/models/Purchase";
import { Product } from "@/models/Product";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const reviewSchema = z.object({
    productId: z.string(),
    rating: z.number().min(1).max(5),
    comment: z.string().max(500).optional(),
});

export async function submitReview(prevState: any, formData: FormData) {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
        return { error: "Vous devez être connecté." };
    }

    const validatedFields = reviewSchema.safeParse({
        productId: formData.get("productId"),
        rating: Number(formData.get("rating")),
        comment: formData.get("comment"),
    });

    if (!validatedFields.success) {
        return { error: "Données invalides." };
    }

    const { productId, rating, comment } = validatedFields.data;

    await connectToDatabase();

    // 1. VÉRIFICATION : L'utilisateur a-t-il acheté ce produit ?
    const hasPurchased = await Purchase.exists({
        buyerId: userId,
        productId: productId,
    });

    // Petite astuce : on laisse aussi le vendeur noter son propre produit pour tester (optionnel)
    const isSeller = await Product.exists({ _id: productId, sellerId: userId });

    if (!hasPurchased && !isSeller) {
        return { error: "Vous devez acheter ce produit pour laisser un avis." };
    }

    try {
        // 2. CRÉATION DE L'AVIS
        // upsert = true permet de mettre à jour l'avis s'il existe déjà
        await Review.findOneAndUpdate(
            { userId, productId },
            {
                userId,
                productId,
                userName: user.firstName || user.username || "Utilisateur",
                rating,
                comment
            },
            { upsert: true, new: true }
        );

        // 3. RECALCUL DE LA MOYENNE (Aggregation Pipeline)
        const stats = await Review.aggregate([
            { $match: { productId: new Object(productId) } }, // Attention au new Object ici si c'est un string
            {
                $group: {
                    _id: "$productId",
                    avgRating: { $avg: "$rating" },
                    totalReviews: { $sum: 1 }
                }
            }
        ]);

        // 4. MISE À JOUR DU PRODUIT
        if (stats.length > 0) {
            await Product.findByIdAndUpdate(productId, {
                averageRating: Math.round(stats[0].avgRating * 10) / 10, // Arrondi à 1 décimale
                reviewCount: stats[0].totalReviews
            });
        }

        revalidatePath(`/product/${productId}`);
        return { success: true, message: "Avis publié avec succès !" };

    } catch (error) {
        console.error("Erreur review:", error);
        return { error: "Une erreur est survenue." };
    }
}