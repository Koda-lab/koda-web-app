"use server";

import Stripe from "stripe";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function getStripeOnboardingLink() {
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
    const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        type: "account_onboarding",
    });

    return accountLink.url;
}

