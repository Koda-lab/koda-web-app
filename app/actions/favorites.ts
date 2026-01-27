"use server";

import { requireAuth } from "@/lib/auth-utils";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import Automation from "@/models/Automation";
import { revalidatePath } from "next/cache";

/**
 * Add a product to the user's favorites
 */
export async function addToFavorites(productId: string) {
    const userId = await requireAuth();
    await connectToDatabase();

    const user = await User.findOne({ clerkId: userId });
    if (!user) throw new Error("User not found");

    // Check if already in favorites
    const alreadyFavorited = user.favorites?.some(
        (id: any) => id.toString() === productId
    );

    if (alreadyFavorited) {
        return { success: false, message: "Already in favorites" };
    }

    // Add to favorites
    await User.updateOne(
        { clerkId: userId },
        { $addToSet: { favorites: productId } }
    );

    revalidatePath("/");
    return { success: true, message: "Added to favorites" };
}

/**
 * Remove a product from the user's favorites
 */
export async function removeFromFavorites(productId: string) {
    const userId = await requireAuth();
    await connectToDatabase();

    await User.updateOne(
        { clerkId: userId },
        { $pull: { favorites: productId } }
    );

    revalidatePath("/");
    return { success: true, message: "Removed from favorites" };
}

/**
 * Toggle a product in favorites (add if not present, remove if present)
 */
export async function toggleFavorite(productId: string) {
    const userId = await requireAuth();
    await connectToDatabase();

    const user = await User.findOne({ clerkId: userId });
    if (!user) throw new Error("User not found");

    const isFavorited = user.favorites?.some(
        (id: any) => id.toString() === productId
    );

    if (isFavorited) {
        await User.updateOne(
            { clerkId: userId },
            { $pull: { favorites: productId } }
        );
        revalidatePath("/");
        return { success: true, action: "removed", message: "Removed from favorites" };
    } else {
        await User.updateOne(
            { clerkId: userId },
            { $addToSet: { favorites: productId } }
        );
        revalidatePath("/");
        return { success: true, action: "added", message: "Added to favorites" };
    }
}

/**
 * Get the user's favorite products with full details
 */
export async function getMyFavorites() {
    const userId = await requireAuth();
    await connectToDatabase();

    const user = await User.findOne({ clerkId: userId })
        .populate({
            path: "favorites",
            model: Automation,
            select: "title price previewImageUrl category platform averageRating reviewCount sellerId"
        })
        .lean();

    if (!user || !user.favorites) return [];

    return user.favorites.map((product: any) => ({
        _id: product._id.toString(),
        title: product.title,
        price: product.price,
        previewImageUrl: product.previewImageUrl,
        category: product.category,
        platform: product.platform,
        averageRating: product.averageRating || 0,
        reviewCount: product.reviewCount || 0,
        sellerId: product.sellerId,
    }));
}

/**
 * Get the user's favorite product IDs (lightweight)
 */
export async function getFavoriteIds(): Promise<string[]> {
    const userId = await requireAuth();
    await connectToDatabase();

    const user = await User.findOne({ clerkId: userId }).select("favorites").lean();
    if (!user || !user.favorites) return [];

    return user.favorites.map((id: any) => id.toString());
}
