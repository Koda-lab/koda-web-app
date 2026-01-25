"use server";

import Stripe from "stripe";
import { requireUser } from "@/lib/auth-utils";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function getStripeOnboardingLink() {
    try {
        const user = await requireUser();

        let stripeAccountId = user.stripeConnectId;

        // 2. Si pas de compte Stripe, on le crée
        if (!stripeAccountId) {
            const account = await stripe.accounts.create({
                type: "express",
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
                metadata: {
                    userId: user.clerkId,
                }
            });

            stripeAccountId = account.id;
            user.stripeConnectId = stripeAccountId;
            await user.save();
        }

        // 3. Créer le lien d'onboarding
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        const accountLink = await stripe.accountLinks.create({
            account: stripeAccountId,
            refresh_url: `${baseUrl}/stripe/return`,
            return_url: `${baseUrl}/stripe/return`,
            type: "account_onboarding",
        });

        return accountLink.url;

    } catch (error: any) {
        console.error("Stripe Connect Error:", error.message);
        throw new Error("Could not configure Stripe at the moment. Please verify that your platform account is active.");
    }
}

export async function getStripeLoginLink() {
    try {
        const user = await requireUser();

        if (!user.stripeConnectId) {
            throw new Error("Stripe account not found");
        }

        const loginLink = await stripe.accounts.createLoginLink(user.stripeConnectId);
        return loginLink.url;
    } catch (error: any) {
        console.error("Login link error:", error.message);
        throw new Error("Could not access the Stripe dashboard.");
    }
}

export async function forceStripeSync() {
    try {
        const user = await requireUser();
        if (!user.stripeConnectId) return { success: false, message: "No Stripe account linked" };

        const account = await stripe.accounts.retrieve(user.stripeConnectId);
        const isComplete = account.details_submitted && account.charges_enabled;

        if (user.onboardingComplete !== isComplete) {
            user.onboardingComplete = isComplete;
            await user.save();
            const { revalidatePath } = await import('next/cache');
            revalidatePath('/');
            return { success: true, updated: true, isComplete };
        }

        return { success: true, updated: false, isComplete };
    } catch (error: any) {
        console.error("Force sync error:", error);
        return { success: false, error: error.message };
    }
}

