import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/db";
import { redirect } from "next/navigation";
import User from "@/models/User";

/**
 * Ensures the user is authenticated and connects to the database.
 * Returns the userId if successful, otherwise redirects or throws.
 * Checks for BAN status.
 */
export async function requireAuth() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    await connectToDatabase();

    // Check if banned - only fetch the field we need
    const user = await User.findOne({ clerkId: userId }).select('isBanned').lean();
    if (user?.isBanned) {
        redirect("/banned");
    }

    return userId;
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

    const user = await User.findOne({ clerkId: userId });

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

    if (!userId) {
        redirect("/sign-in");
    }

    await connectToDatabase();

    const user = await User.findOne({ clerkId: userId });

    if (!user || user.role !== 'admin') {
        redirect("/");
    }

    if (user.isBanned) {
        redirect("/banned");
    }

    return user;
}
