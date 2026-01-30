import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/db";
import { redirect as nextRedirect } from "next/navigation";
import { redirect } from "@/i18n/routing";
import { getLocale } from "next-intl/server";
import User from "@/models/User";

/**
 * Ensures the user is authenticated and connects to the database.
 * Returns the userId if successful, otherwise redirects or throws.
 * Checks for BAN status.
 */
export async function requireAuth() {
    const { userId } = await auth();
    const locale = await getLocale();

    if (!userId) {
        redirect({ href: "/sign-in", locale });
    }

    await connectToDatabase();

    // Check if banned - only fetch the field we need
    let user = await User.findOne({ clerkId: userId as string }).select('isBanned').lean();

    // Lazy sync for requireAuth
    if (!user) {
        try {
            const { clerkClient } = await import("@clerk/nextjs/server");
            const client = await clerkClient();
            const clerkUser = await client.users.getUser(userId!);

            if (clerkUser) {
                const email = clerkUser.emailAddresses[0]?.emailAddress;

                // Check if a user with this email already exists
                const existingUserByEmail = await User.findOne({ email }).select('isBanned').lean();

                if (existingUserByEmail) {
                    // Update the clerkId for the existing user
                    user = await User.findOneAndUpdate(
                        { email },
                        {
                            clerkId: userId!,
                            firstName: clerkUser.firstName ?? undefined,
                            lastName: clerkUser.lastName ?? undefined,
                            imageUrl: clerkUser.imageUrl,
                            username: clerkUser.username ?? undefined,
                        },
                        { new: true }
                    ).select('isBanned').lean();
                } else {
                    // Create and return the user (we only need isBanned here)
                    const newUser = await User.create({
                        clerkId: userId!,
                        email: email,
                        firstName: clerkUser.firstName ?? undefined,
                        lastName: clerkUser.lastName ?? undefined,
                        imageUrl: clerkUser.imageUrl,
                        username: clerkUser.username ?? undefined,
                        role: 'user',
                        onboardingComplete: false
                    });
                    user = newUser as any;
                }
            }
        } catch (error) {
            console.error("Failed to lazy-sync user in requireAuth:", error);
            // We don't throw here, we just proceed. If they really don't exist, other checks might fail later.
        }
    }
    if (user?.isBanned) {
        redirect({ href: "/banned", locale });
    }

    return userId!;
}

/**
 * Ensures the user is authenticated strictly (for API/Actions/Mutation).
 * Throws an error instead of redirecting (better for Try/Catch blocks).
 * Checks for BAN status.
 */
export async function requireUser() {
    const { userId } = await auth();

    if (!userId) {
        throw new Error("unauthorized");
    }

    await connectToDatabase();

    let user = await User.findOne({ clerkId: userId as string });

    // Lazy sync: If user is authenticated in Clerk but not in DB, create them now.
    if (!user) {
        console.log("[requireUser] User not found in DB, attempting lazy sync for userId:", userId);
        try {
            const { clerkClient } = await import("@clerk/nextjs/server");
            const client = await clerkClient();
            console.log("[requireUser] ClerkClient initialized, fetching user data...");

            const clerkUser = await client.users.getUser(userId!);
            console.log("[requireUser] ClerkUser fetched:", {
                id: clerkUser.id,
                email: clerkUser.emailAddresses[0]?.emailAddress,
                username: clerkUser.username,
                firstName: clerkUser.firstName,
                lastName: clerkUser.lastName
            });

            if (clerkUser) {
                const email = clerkUser.emailAddresses[0]?.emailAddress;

                if (!email) {
                    console.error("[requireUser] No email found for user, cannot create user");
                    throw new Error("noEmail");
                }

                // Check if a user with this email already exists
                const existingUserByEmail = await User.findOne({ email });

                if (existingUserByEmail) {
                    console.log("[requireUser] User with email already exists, updating clerkId for user:", existingUserByEmail._id);

                    // Update the existing user's clerkId and other info
                    user = await User.findOneAndUpdate(
                        { email },
                        {
                            clerkId: userId!,
                            firstName: clerkUser.firstName ?? undefined,
                            lastName: clerkUser.lastName ?? undefined,
                            imageUrl: clerkUser.imageUrl,
                            username: clerkUser.username ?? undefined,
                        },
                        { new: true }
                    );

                    console.log("[requireUser] User updated successfully:", user!._id);
                } else {
                    console.log("[requireUser] Creating new user in MongoDB with email:", email);

                    user = await User.create({
                        clerkId: userId!,
                        email: email,
                        firstName: clerkUser.firstName ?? undefined,
                        lastName: clerkUser.lastName ?? undefined,
                        imageUrl: clerkUser.imageUrl,
                        username: clerkUser.username ?? undefined,
                        role: 'user',
                        onboardingComplete: false
                    });

                    console.log("[requireUser] User created successfully:", user._id);
                }
            }
        } catch (error) {
            console.error("=".repeat(80));
            console.error("[requireUser] FAILED TO LAZY-SYNC USER");
            console.error("Error type:", error instanceof Error ? error.constructor.name : typeof error);
            console.error("Error message:", error instanceof Error ? error.message : String(error));
            console.error("Full error:", error);
            if (error instanceof Error && error.stack) {
                console.error("Stack trace:", error.stack);
            }
            console.error("=".repeat(80));
            throw new Error(`userSyncFailed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    if (!user) {
        throw new Error("userNotFound");
    }

    if (user.isBanned) {
        throw new Error("accountSuspended");
    }

    return user;
}

/**
 * Ensures the user is authenticated AND is an admin.
 */
export async function requireAdmin() {
    const { userId } = await auth();
    const locale = await getLocale();

    if (!userId) {
        redirect({ href: "/sign-in", locale });
    }

    await connectToDatabase();

    const user = await User.findOne({ clerkId: userId as string });

    if (!user || user.role !== 'admin') {
        redirect({ href: "/", locale });
    }

    if (user!.isBanned) {
        redirect({ href: "/banned", locale });
    }

    return user;
}
