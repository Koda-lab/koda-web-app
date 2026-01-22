"use server";

import Stripe from "stripe";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/db";
import Automation from "@/models/Automation";
import User from "@/models/User";
import { redirect } from "next/navigation";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function createCheckoutSession(automationId: string) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error("Vous devez être connecté pour acheter ce produit.");
    }

    await connectToDatabase();

    // 1. Récupérer les détails de l'automatisation
    const product = await Automation.findById(automationId).lean();

    if (!product) {
        throw new Error("Produit introuvable.");
    }

    // 2. Récupérer le ID Stripe Connect du vendeur
    const stringSellerId = typeof product.sellerId === 'object' ? product.sellerId.toString() : product.sellerId;
    const seller = await User.findOne({ clerkId: stringSellerId });

    if (!seller || !seller.stripeConnectId) {
        throw new Error("Le vendeur n'a pas configuré ses paiements.");
    }

    // 3. Calculer les frais de la plateforme (15%)
    const priceInCents = Math.round(product.price * 100); // Stripe attend des centimes
    const applicationFeeAmount = Math.round(priceInCents * 0.15); // 15% de frais

    // 4. Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
            {
                price_data: {
                    currency: "eur",
                    product_data: {
                        name: product.title,
                        description: product.description,
                        images: product.previewImageUrl ? [product.previewImageUrl] : [],
                    },
                    unit_amount: priceInCents,
                },
                quantity: 1,
            },
        ],
        mode: "payment",
        payment_intent_data: {
            application_fee_amount: applicationFeeAmount,
            transfer_data: {
                destination: seller.stripeConnectId,
            },
        },
        metadata: {
            productId: automationId,
            userId: userId,
        },
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/product/${automationId}`,
    });

    if (!session.url) {
        throw new Error("Erreur lors de la création de la session Stripe.");
    }

    // Rediriger vers Stripe
    return session.url;
}
