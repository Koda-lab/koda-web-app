"use server";

import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/db";
import Automation from "@/models/Automation";
import { revalidatePath } from "next/cache";
import { UpdateProductSchema } from "@/lib/validations";

/**
 * Supprime un produit si l'utilisateur est bien le vendeur.
 */
export async function deleteProduct(productId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Non autorisé");

    await connectToDatabase();

    const product = await Automation.findOne({ _id: productId });

    if (!product) {
        throw new Error("Produit introuvable");
    }

    if (product.sellerId !== userId) {
        throw new Error("Vous n'êtes pas autorisé à supprimer ce produit");
    }

    await Automation.deleteOne({ _id: productId });

    revalidatePath("/dashboard");
    return { success: true };
}

/**
 * Met à jour un produit (titre, description, prix, image).
 * Note: Pour l'instant on ne permet pas de changer le fichier ou la catégorie pour simplifier,
 * mais c'est facile à ajouter.
 */
export async function updateProduct(productId: string, data: { title: string; description: string; price: number; previewImageUrl?: string }) {
    const { userId } = await auth();
    if (!userId) throw new Error("Non autorisé");

    // Validation Zod (Partielle car on ne valide que les champs reçus)
    // On recrée l'objet pour la validation
    const validationResult = UpdateProductSchema.safeParse(data);

    if (!validationResult.success) {
        throw new Error(validationResult.error.issues[0].message);
    }

    const validData = validationResult.data;

    await connectToDatabase();

    const product = await Automation.findOne({ _id: productId });

    if (!product) throw new Error("Produit introuvable");
    if (product.sellerId !== userId) throw new Error("Non autorisé");

    product.title = validData.title;
    product.description = validData.description;
    product.price = validData.price;
    if (validData.previewImageUrl) {
        product.previewImageUrl = validData.previewImageUrl;
    }

    await product.save();

    revalidatePath("/dashboard");
    return { success: true };
}
