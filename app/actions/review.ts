"use server";

import { requireUser } from "@/lib/auth-utils";
import { connectToDatabase } from "@/lib/db";
import Review from "@/models/Review";
import Purchase from "@/models/Purchase";
import { Product } from "@/models/Product";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import mongoose from "mongoose";
import { createNotification } from "@/app/actions/notifications";


export async function submitContent(prevState: any, formData: FormData) {
    let user;
    try {
        user = await requireUser();
    } catch (err: any) {
        return { error: err.message };
    }

    const userId = user.clerkId;
    const rawData = {
        productId: formData.get("productId"),
        path: formData.get("path"),
        type: formData.get("type") || 'review',
        rating: formData.get("rating") ? Number(formData.get("rating")) : undefined,
        comment: formData.get("comment"),
    };

    const { productId, type, rating, comment } = rawData as any;
    const path = formData.get("path") as string;

    await connectToDatabase();

    // logique de vérification d'achat
    try {
        if (type === 'review') {
            const hasPurchased = await Purchase.findOne({
                buyerId: userId,
                productId: new mongoose.Types.ObjectId(productId)
            });

            if (!hasPurchased) {
                return { error: "mustPurchaseToReview" };
            }
        }

        // logique de création/update
        if (type === 'review') {
            await Review.findOneAndUpdate(
                { userId, productId, type: 'review' },
                {
                    userName: user.firstName || "User",
                    rating,
                    comment
                },
                { upsert: true, new: true }
            );

            // Notify Seller
            const product = await Product.findById(productId);
            if (product && product.sellerId) {
                // If checking that reviewer != seller
                if (product.sellerId.toString() !== userId) {
                    await createNotification(
                        product.sellerId,
                        "REVIEW",
                        "Nouvel avis reçue",
                        `${user.firstName} a laissé un avis sur ${product.title}`,
                        `/product/${productId}`,
                        'Notifications.reviewReceivedTitle',
                        'Notifications.reviewReceivedBody',
                        {
                            userName: user.firstName || 'User',
                            productTitle: product.title
                        }
                    );
                }
            }
        } else if (type === 'reply') {
            const parentId = formData.get("parentId");
            const reviewId = formData.get("reviewId"); // ID of the reply itself if editing

            if (!parentId) return { error: "missingParentId" };

            // Verify that the user is the seller of the product
            const product = await Product.findById(productId);
            if (!product) return { error: "productNotFound" };

            if (product.sellerId.toString() !== userId) {
                return { error: "onlySellerCanReply" };
            }

            if (reviewId) {
                // UPDATE existing reply
                const updated = await Review.findOneAndUpdate(
                    { _id: reviewId, userId, type: 'reply' },
                    { comment },
                    { new: true }
                );
                if (!updated) return { error: "reviewNotFound" };
            } else {
                // CREATE new reply
                await Review.create({
                    productId,
                    userId,
                    userName: user.firstName || "Seller",
                    type: 'reply',
                    parentId,
                    comment
                });

                // Notify the original reviewer
                const originalReview = await Review.findById(parentId);
                if (originalReview) {
                    await createNotification(
                        originalReview.userId,
                        "REVIEW",
                        "Réponse du vendeur",
                        `Le vendeur a répondu à votre avis sur ${product.title}`,
                        `/product/${productId}`,
                        'Notifications.replyReceivedTitle',
                        'Notifications.replyReceivedBody',
                        {
                            productTitle: product.title
                        }
                    );
                }
            }

        } else {
            // Discussion logic could be added here
            await Review.create({
                productId,
                userId,
                userName: user.firstName || "User",
                type: 'comment',
                comment
            });
        }

        // CALCUL DE MOYENNE
        if (type === 'review') {
            await updateProductStats(productId);
        }

        if (path) {
            revalidatePath(path);
        } else {
            revalidatePath(`/product/${productId}`);
        }

        return { success: true, message: "reviewSuccess" };

    } catch (error) {
        console.error(error);
        return { error: "serverError" };
    }
}

export async function deleteReview(prevState: any, formData: FormData) {
    let user;
    try {
        user = await requireUser();
    } catch (err: any) {
        return { error: err.message };
    }

    const userId = user.clerkId;
    const reviewId = formData.get("reviewId") as string;
    const path = formData.get("path") as string;

    await connectToDatabase();

    try {
        const review = await Review.findById(reviewId);

        if (!review) {
            return { error: "reviewNotFound" };
        }

        if (review.userId !== userId) {
            return { error: "notAuthorizedToDeleteReview" };
        }

        const productId = review.productId;
        await Review.findByIdAndDelete(reviewId);

        // Update stats
        if (review.type === 'review') {
            await updateProductStats(productId.toString());
        }

        if (path) {
            revalidatePath(path);
        }

        return { success: true, message: "reviewDeleted" };
    } catch (error) {
        console.error(error);
        return { error: "serverError" };
    }
}

async function updateProductStats(productId: string) {
    const stats = await Review.aggregate([
        {
            $match: {
                productId: new mongoose.Types.ObjectId(productId),
                type: 'review'
            }
        },
        { $group: { _id: "$productId", avg: { $avg: "$rating" }, count: { $sum: 1 } } }
    ]);

    if (stats.length > 0) {
        await Product.findByIdAndUpdate(productId, {
            averageRating: Math.round(stats[0].avg * 10) / 10,
            reviewCount: stats[0].count
        });
    } else {
        await Product.findByIdAndUpdate(productId, {
            averageRating: 0,
            reviewCount: 0
        });
    }
}