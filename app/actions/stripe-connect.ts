"use server";

import Stripe from "stripe";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function getStripeOnboardingLink() {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Non autorisé");

        await connectToDatabase();

        // 1. Chercher l'utilisateur ou le créer
        let user = await User.findOne({ clerkId: userId });

        let stripeAccountId = user?.stripeConnectId;

        // 2. Si pas de compte Stripe, on le crée
        if (!stripeAccountId) {
            const account = await stripe.accounts.create({
                type: "express",
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
            });

            stripeAccountId = account.id;

            if (!user) {
                await User.create({ clerkId: userId, stripeConnectId: stripeAccountId });
            } else {
                user.stripeConnectId = stripeAccountId;
                await user.save();
            }
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
        console.error("Erreur Stripe Connect:", error.message);
        // Au lieu de faire planter la page, on peut renvoyer une erreur gérable
        throw new Error("Impossible de configurer Stripe pour le moment. Vérifiez que votre compte plateforme est activé.");
    }

}


export async function getStripeLoginLink() {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Non autorisé");

        await connectToDatabase();
        const user = await User.findOne({ clerkId: userId });

        if (!user || !user.stripeConnectId) {
            throw new Error("Compte Stripe non trouvé");
        }

        const loginLink = await stripe.accounts.createLoginLink(user.stripeConnectId);
        return loginLink.url;
    } catch (error: any) {
        console.error("Erreur login link:", error.message);
        throw new Error("Impossible d'accéder au dashboard Stripe.");
    }
}
