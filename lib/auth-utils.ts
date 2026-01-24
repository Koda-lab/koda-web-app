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

    // Check if banned
    const user = await User.findOne({ clerkId: userId }, 'isBanned');
    if (user?.isBanned) {
        redirect("/banned"); // Create this page later or just redirect home with error?
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
        throw new Error("Unauthorized: User is declared but not authenticated");
    }

    await connectToDatabase();

    // Check if banned
    const user = await User.findOne({ clerkId: userId }, 'isBanned');
    if (user?.isBanned) {
        throw new Error("Access Denied: Your account has been suspended.");
    }

    return userId;
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
        redirect("/"); // Build a 403 page ideally, but home redirect works for MVP
    }

    // Admins technically can't be banned by this logic unless we check, 
    // but usually we don't want to lock out admins unless intentional.
    // Let's enforce it for consistency.
    if (user.isBanned) {
        redirect("/banned");
    }

    return userId;
}
