"use server";

import { requireAdmin } from "@/lib/auth-utils";
import User from "@/models/User";
import { revalidatePath } from "next/cache";
import { clerkClient } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { Product } from "@/models/Product";
import Purchase from "@/models/Purchase";
import { ratelimit } from "@/lib/ratelimit";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

/**
 * Récupère tous les utilisateurs (pour l'admin).
 * Synchronise automatiquement les données manquantes avec Clerk.
 */
export async function getAllUsers() {
    await requireAdmin();

    const users = await User.find({})
        .select("-cart")
        .sort({ createdAt: -1 })
        .lean();

    // Identification des utilisateurs avec données manquantes
    const usersToSync = users.filter(u => !u.email || !u.firstName || !u.lastName);

    if (usersToSync.length > 0) {
        try {
            const client = await clerkClient();

            // On lance la synchro en parallèle pour ne pas bloquer trop longtemps
            await Promise.all(usersToSync.map(async (localUser) => {
                try {
                    const clerkUser = await client.users.getUser(localUser.clerkId);

                    const email = clerkUser.emailAddresses[0]?.emailAddress;
                    const firstName = clerkUser.firstName;
                    const lastName = clerkUser.lastName;
                    const imageUrl = clerkUser.imageUrl;

                    // Update DB if found
                    if (email || firstName || lastName) {
                        await User.findByIdAndUpdate(localUser._id, {
                            email: email || localUser.email,
                            firstName: firstName || localUser.firstName,
                            lastName: lastName || localUser.lastName,
                            imageUrl: imageUrl || localUser.imageUrl,
                            username: clerkUser.username || localUser.username
                        });

                        // Update local object for immediate return
                        if (email) localUser.email = email;
                        if (firstName) localUser.firstName = firstName;
                        if (lastName) localUser.lastName = lastName;
                    }
                } catch (err) {
                    console.error(`Failed to sync user ${localUser.clerkId}:`, err);
                }
            }));
        } catch (error) {
            console.error("Error connecting to Clerk Client:", error);
        }
    }

    return users.map((user: any) => ({
        ...user,
        _id: user._id.toString(),
        isBanned: !!user.isBanned, // Force to boolean
        createdAt: user.createdAt?.toISOString(),
        updatedAt: user.updatedAt?.toISOString(),
    }));
}

/**
 * Change le rôle d'un utilisateur (ex: promouvoir admin).
 */
export async function updateUserRole(userId: string, newRole: 'user' | 'admin') {
    await requireAdmin();

    await User.findOneAndUpdate({ clerkId: userId }, { role: newRole });
    revalidatePath("/admin");
    return { success: true };
}

/**
 * Supprime un utilisateur (Ban).
 */
/**
 * Change le statut 'Banni' d'un utilisateur (Soft Ban).
 */
export async function toggleBanUser(userId: string) {
    const admin = await requireAdmin();

    // userId passed from frontend is clerkId
    if (admin.clerkId === userId) {
        throw new Error("You cannot ban yourself.");
    }

    const user = await User.findOne({ clerkId: userId });
    if (!user) throw new Error("User not found.");

    user.isBanned = !user.isBanned;
    await user.save();

    revalidatePath("/admin");
    return { success: true, isBanned: user.isBanned };
}


/**
 * Full Sync with Clerk.
 * 1. Upserts all Clerk users into the local DB.
 * 2. Deletes local users that are NOT in Clerk.
 */
export async function fullSyncWithClerk() {
    const admin = await requireAdmin();

    // RATE LIMITING
    const { success } = await ratelimit.limit(`admin_sync_${admin.clerkId}`);
    if (!success) {
        throw new Error("Too many requests. Please try again later.");
    }
    const client = await clerkClient();
    let totalSynced = 0;
    const clerkIds = new Set<string>();

    let hasMore = true;
    let offset = 0;
    const limit = 100;

    while (hasMore) {
        const { data: clerkUsers, totalCount } = await client.users.getUserList({
            limit,
            offset,
        });

        if (clerkUsers.length === 0) {
            hasMore = false;
            break;
        }

        await Promise.all(clerkUsers.map(async (clerkUser) => {
            const email = clerkUser.emailAddresses[0]?.emailAddress;
            clerkIds.add(clerkUser.id);

            await User.findOneAndUpdate(
                { clerkId: clerkUser.id },
                {
                    clerkId: clerkUser.id,
                    email: email,
                    firstName: clerkUser.firstName,
                    lastName: clerkUser.lastName,
                    imageUrl: clerkUser.imageUrl,
                    username: clerkUser.username,
                    $setOnInsert: {
                        role: 'user',
                        isBanned: false,
                        onboardingComplete: false
                    }
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            totalSynced++;
        }));

        offset += limit;
        if (offset >= totalCount) hasMore = false;
    }

    // Cleanup: Find local users whose clerkId is NOT in the set of IDs we just fetched
    const localUsers = await User.find({}, "clerkId").lean();
    const idsToDelete = localUsers
        .filter(lu => !clerkIds.has(lu.clerkId))
        .map(lu => lu.clerkId);

    if (idsToDelete.length > 0) {
        await User.deleteMany({ clerkId: { $in: idsToDelete } });
        console.log(`Cleaned up ${idsToDelete.length} orphaned users.`);
    }

    revalidatePath("/admin");
    return { success: true, count: totalSynced, deleted: idsToDelete.length };
}

/**
 * Supprime un utilisateur de manière COMPLÈTE (Nuclear Delete).
 * 1. Supprime le compte Stripe Connect (si existe)
 * 2. Supprime l'utilisateur de Clerk
 * 3. Supprime tous ses produits
 * 4. Supprime son historique (ventes et achats)
 * 5. Supprime l'utilisateur de MongoDB
 */
export async function deleteUser(userId: string) {
    const admin = await requireAdmin();

    // RATE LIMITING
    const { success } = await ratelimit.limit(`admin_delete_${admin.clerkId}`);
    if (!success) {
        throw new Error("Too many requests. Please try again later.");
    }

    if (admin.clerkId === userId) throw new Error("You cannot delete yourself.");

    const user = await User.findOne({ clerkId: userId });
    if (!user) throw new Error("User not found in local database.");

    const client = await clerkClient();

    // 1. Delete from Stripe Connect (if applicable)
    if (user.stripeConnectId) {
        try {
            await stripe.accounts.del(user.stripeConnectId);
            console.log(`Stripe account ${user.stripeConnectId} deleted.`);
        } catch (err) {
            console.error("Failed to delete Stripe account:", err);
        }
    }

    // 2. Delete from Clerk
    try {
        await client.users.deleteUser(userId);
        console.log(`User ${userId} deleted from Clerk.`);
    } catch (err) {
        console.error("Failed to delete Clerk user:", err);
    }

    // 3. Delete Products
    try {
        await Product.deleteMany({ sellerId: userId });
        console.log(`Products for user ${userId} deleted.`);
    } catch (err) {
        console.error("Failed to delete products:", err);
    }

    // 4. Delete Purchases (Buyer & Seller)
    try {
        await Purchase.deleteMany({
            $or: [{ buyerId: userId }, { sellerId: userId }]
        });
        console.log(`Purchase records for user ${userId} deleted.`);
    } catch (err) {
        console.error("Failed to delete purchase records:", err);
    }

    // 5. Delete from MongoDB
    await User.findOneAndDelete({ clerkId: userId });

    revalidatePath("/admin");
    return { success: true };
}
