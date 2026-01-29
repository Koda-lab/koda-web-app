"use server";

import { requireUser } from "@/lib/auth-utils";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import Automation from "@/models/Automation";
import { revalidatePath } from "next/cache";

/**
 * Add a product to the user's favorites
 */
export async function addToFavorites(productId: string) {
    const user = await requireUser();
    // const userId = user.clerkId; // Not needed as we have user object
    await connectToDatabase();

    // const user = await User.findOne({ clerkId: userId }); // Already fetched by requireUser
    // if (!user) throw new Error("User not found");

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
    const user = await requireUser();
    await connectToDatabase();

    await User.updateOne(
        { clerkId: user.clerkId },
        { $pull: { favorites: productId } }
    );

    revalidatePath("/");
    return { success: true, message: "Removed from favorites" };
}

/**
 * Toggle a product in favorites (add if not present, remove if present)
 */
export async function toggleFavorite(productId: string) {
    const user = await requireUser();
    await connectToDatabase();

    // const user = await User.findOne({ clerkId: userId }); // Already fetched
    // if (!user) throw new Error("User not found");

    const isFavorited = user.favorites?.some(
        (id: any) => id.toString() === productId
    );

    if (isFavorited) {
        await User.updateOne(
            { clerkId: user.clerkId },
            { $pull: { favorites: productId } }
        );
        revalidatePath("/");
        return { success: true, action: "removed", message: "Removed from favorites" };
    } else {
        await User.updateOne(
            { clerkId: user.clerkId },
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
    const user = await requireUser();
    await connectToDatabase();

    // Re-fetch to populate
    const populatedUser = await User.findOne({ clerkId: user.clerkId })
        .populate({
            path: "favorites",
            model: Automation,
            select: "title price previewImageUrl category platform averageRating reviewCount sellerId"
        })
        .lean();

        .lean();

    if (!populatedUser || !populatedUser.favorites) return [];

    return populatedUser.favorites.map((product: any) => ({
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
    const user = await requireUser();
    await connectToDatabase();

    // favorites is already present in the user object returned by requireUser if selected, 
    // but requireUser returns the whole document. Let's rely on the returned user object
    // IF the user object has favorites populated. 
    // SAFEST: Re-query to be sure we get the latest array or use the one from requireUser if we trust it.
    // requireUser does findOne, so it has favorites.

    // Actually, let's just refresh it to be safe or use the returned object.
    // user from requireUser is a mongoose document.

    if (!user.favorites) return [];

    return user.favorites.map((id: any) => id.toString());
}
