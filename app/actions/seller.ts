"use server";

import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import Purchase from "@/models/Purchase";
import Automation from "@/models/Automation";

interface SellerStats {
    totalProducts: number;
    totalSales: number;
    averageRating: number;
    memberSince: Date;
}

interface SellerProfile {
    _id: string;
    clerkId: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    imageUrl?: string;
    bio?: string;
    onboardingComplete: boolean;
    createdAt: Date;
    stats: SellerStats;
    products: any[];
}

/**
 * Get a seller's public profile including their products and stats
 */
export async function getSellerProfile(sellerId: string): Promise<SellerProfile | null> {
    try {
        await connectToDatabase();

        // Get seller user data
        const seller = await User.findOne({ clerkId: sellerId })
            .select('clerkId username firstName lastName imageUrl bio onboardingComplete createdAt')
            .lean();

        if (!seller) {
            return null;
        }

        // Get seller's products
        const products = await Automation.find({
            sellerId: sellerId
        })
            .select('title description price category platform fileUrl previewImageUrl averageRating reviewCount isCertified createdAt sellerId')
            .sort({ createdAt: -1 })
            .lean();

        // Get total sales count
        const salesCount = await Purchase.countDocuments({ sellerId: sellerId });

        // Calculate average rating across all products
        const productsWithRatings = products.filter(p => p.reviewCount > 0);
        const averageRating = productsWithRatings.length > 0
            ? productsWithRatings.reduce((acc, p) => acc + (p.averageRating || 0), 0) / productsWithRatings.length
            : 0;

        const displayName = seller.username ||
            `${seller.firstName || ''} ${seller.lastName || ''}`.trim() ||
            'Vendeur';

        return {
            _id: (seller as any)._id.toString(),
            clerkId: seller.clerkId,
            username: seller.username,
            firstName: seller.firstName,
            lastName: seller.lastName,
            imageUrl: seller.imageUrl,
            bio: seller.bio,
            onboardingComplete: seller.onboardingComplete,
            createdAt: seller.createdAt,
            stats: {
                totalProducts: products.length,
                totalSales: salesCount,
                averageRating: Math.round(averageRating * 10) / 10,
                memberSince: seller.createdAt,
            },
            products: products.map(p => ({
                ...p,
                _id: (p as any)._id.toString(),
                seller: {
                    username: displayName
                }
            })),
        };
    } catch (error) {
        console.error("Error fetching seller profile:", error);
        return null;
    }
}

/**
 * Update a seller's profile
 */
export async function updateSellerProfile(userId: string, data: {
    username?: string;
    firstName?: string;
    lastName?: string;
    bio?: string;
}) {
    try {
        await connectToDatabase();

        // Validate username uniqueness if changed
        if (data.username) {
            const existingUser = await User.findOne({
                username: data.username,
                clerkId: { $ne: userId }
            });

            if (existingUser) {
                return { success: false, error: 'username_taken' };
            }
        }

        const updatedUser = await User.findOneAndUpdate(
            { clerkId: userId },
            {
                $set: {
                    username: data.username,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    bio: data.bio
                }
            },
            { new: true }
        );

        if (!updatedUser) {
            return { success: false, error: 'user_not_found' };
        }

        return { success: true };
    } catch (error) {
        console.error("Error updating seller profile:", error);
        return { success: false, error: 'internal_error' };
    }
}
