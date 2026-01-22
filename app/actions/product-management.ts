"use server";

import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/db";
import Automation from "@/models/Automation";
import { revalidatePath } from "next/cache";

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

    await connectToDatabase();

    const product = await Automation.findOne({ _id: productId });

    if (!product) throw new Error("Produit introuvable");
    if (product.sellerId !== userId) throw new Error("Non autorisé");

    product.title = data.title;
    product.description = data.description;
    product.price = data.price;
    if (data.previewImageUrl) {
        product.previewImageUrl = data.previewImageUrl;
    }

    await product.save();

    revalidatePath("/dashboard");
    return { success: true };
}
