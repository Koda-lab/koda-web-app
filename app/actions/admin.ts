"use server";

import { requireAdmin } from "@/lib/auth-utils";
import User from "@/models/User";
import { revalidatePath } from "next/cache";

/**
 * Récupère tous les utilisateurs (pour l'admin).
 */
import { clerkClient } from "@clerk/nextjs/server";

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

    await User.findByIdAndUpdate(userId, { role: newRole });
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
    const adminId = await requireAdmin();

    const currentAdmin = await User.findOne({ clerkId: adminId });
    if (currentAdmin?._id.toString() === userId) {
        throw new Error("Vous ne pouvez pas vous bannir vous-même.");
    }

    const user = await User.findById(userId);
    if (!user) throw new Error("Utilisateur introuvable.");

    user.isBanned = !user.isBanned;
    await user.save();

    revalidatePath("/admin");
    return { success: true, isBanned: user.isBanned };
}


/**
 * Restaure tous les utilisateurs depuis Clerk (Recovery).
 * Utile si des utilisateurs ont été supprimés localement par erreur.
 */
export async function restoreAllUsersFromClerk() {
    await requireAdmin();
    const client = await clerkClient();
    let count = 0;

    let hasMore = true;
    let offset = 0;
    const limit = 100;

    while (hasMore) {
        // Fetch users from Clerk
        const { data: clerkUsers, totalCount } = await client.users.getUserList({
            limit,
            offset,
        });

        if (clerkUsers.length === 0) {
            hasMore = false;
            break;
        }

        // Sync each user
        await Promise.all(clerkUsers.map(async (clerkUser) => {
            const email = clerkUser.emailAddresses[0]?.emailAddress;

            await User.findOneAndUpdate(
                { clerkId: clerkUser.id },
                {
                    clerkId: clerkUser.id,
                    email: email,
                    firstName: clerkUser.firstName,
                    lastName: clerkUser.lastName,
                    imageUrl: clerkUser.imageUrl,
                    username: clerkUser.username,
                    // Preserve existing role/ban status if exists, otherwise default
                    $setOnInsert: {
                        role: 'user',
                        isBanned: false,
                        onboardingComplete: false
                    }
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            count++;
        }));

        offset += limit;
        if (offset >= totalCount) {
            hasMore = false;
        }
    }

    revalidatePath("/admin");
    return { success: true, count };
}
