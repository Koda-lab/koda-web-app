// app/api/webhooks/stripe/route.ts

import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Purchase from "@/models/Purchase";
import User from "@/models/User";
import Automation from "@/models/Automation";
import { sendBuyerEmail, sendSellerEmail } from "@/lib/emails";
import { clerkClient } from "@clerk/nextjs/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-12-15.clover",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get("Stripe-Signature") as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error: any) {
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    // On écoute l'événement "Session de paiement terminée"
    if (event.type === "checkout.session.completed") {
        try {
            const session = event.data.object as Stripe.Checkout.Session;

            // Récupération des métadonnées
            const userId = session.metadata?.userId;
            const productIdsString = session.metadata?.productIds; // C'est maintenant une liste (String JSON)

            // Fallback pour compatibilité (si c'est un vieil achat avec un seul ID)
            const singleProductId = session.metadata?.productId;

            if (userId) {
                await connectToDatabase();

                const productIds: string[] = [];

                // Cas 1 : Panier (Liste d'IDs)
                if (productIdsString) {
                    try {
                        const parsed = JSON.parse(productIdsString);
                        if (Array.isArray(parsed)) {
                            productIds.push(...parsed);
                        }
                    } catch (e) {
                        console.error("Erreur parsing productIds:", e);
                    }
                }
                // Cas 2 : Achat unique (Ancienne méthode)
                else if (singleProductId) {
                    productIds.push(singleProductId);
                }

                // On récupère la session complète une seule fois pour avoir le chargeId (Utile pour les transferts)
                const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
                    expand: ["payment_intent.latest_charge"],
                });
                const paymentIntent = fullSession.payment_intent as Stripe.PaymentIntent;
                const chargeId = (paymentIntent?.latest_charge as Stripe.Charge)?.id;

                // On crée une preuve d'achat pour CHAQUE produit trouvé
                if (productIds.length > 0) {
                    const buyerEmail = session.customer_details?.email;
                    const buyerOrderItems: { title: string, price: number }[] = [];
                    let orderTotal = 0;

                    for (const productId of productIds) {
                        try {
                            // 1. On récupère le produit pour avoir le vendeur (sellerId)
                            const product = await Automation.findById(productId);

                            if (product) {
                                const seller = await User.findOne({ clerkId: typeof product.sellerId === 'object' ? product.sellerId.toString() : product.sellerId });

                                buyerOrderItems.push({ title: product.title, price: product.price });
                                orderTotal += product.price;

                                if (!seller?.stripeConnectId) {
                                    console.error(`Seller ${product.sellerId} has no Stripe Connect ID. Skipping transfer.`);
                                }

                                // 1. Create the purchase record locally
                                const existingPurchase = await Purchase.findOne({
                                    buyerId: userId,
                                    productId: productId
                                });

                                if (!existingPurchase) {
                                    const platformFee = product.price * 0.15;
                                    const netAmount = product.price - platformFee;

                                    await Purchase.create({
                                        buyerId: userId,
                                        productId: productId,
                                        sellerId: seller?.clerkId || product.sellerId,
                                        stripeSessionId: session.id,
                                        amount: product.price,
                                        netAmount: netAmount,
                                        platformFee: platformFee,
                                        category: product.category,
                                        platform: (product as any).platform, // Automation platform
                                    });

                                    // 1a. Send Email to Seller
                                    if (seller) {
                                        let sellerEmail = seller.email;
                                        if (!sellerEmail) {
                                            try {
                                                const clerk = await clerkClient();
                                                const clerkUser = await clerk.users.getUser(seller.clerkId);
                                                sellerEmail = clerkUser.emailAddresses[0]?.emailAddress;
                                            } catch (e) {
                                                console.error("Failed to fetch seller email from Clerk:", e);
                                            }
                                        }

                                        if (sellerEmail) {
                                            await sendSellerEmail(sellerEmail, product.title, product.price * 0.85);
                                        }
                                    }
                                }

                                // 2. Transfer 85% of the price to the seller (if they have a connect ID)
                                if (seller?.stripeConnectId) {
                                    try {
                                        const transferAmount = Math.round(product.price * 100 * 0.85); // 85% in cents

                                        await stripe.transfers.create({
                                            amount: transferAmount,
                                            currency: "eur",
                                            destination: seller.stripeConnectId,
                                            description: `Payout for ${product.title}`,
                                            source_transaction: chargeId, // Link transfer to the original charge
                                            metadata: {
                                                productId: productId.toString(),
                                                buyerId: userId,
                                            },
                                        });
                                        console.log(`Transfer of ${transferAmount} cents of ${product.price} to seller ${seller.stripeConnectId} successful.`);
                                    } catch (transferError) {
                                        console.error(`Failed to transfer funds to seller ${seller.stripeConnectId}:`, transferError);
                                    }
                                }
                            }
                        } catch (innerError) {
                            console.error(`Error processing product ${productId}:`, innerError);
                        }
                    }

                    // 3. Send Email to Buyer
                    if (buyerEmail && buyerOrderItems.length > 0) {
                        await sendBuyerEmail(buyerEmail, buyerOrderItems, orderTotal);
                    }

                    // Optionnel : Vider le panier de l'utilisateur dans la BDD
                    await User.findOneAndUpdate({ clerkId: userId }, { cart: [] });
                }
            }
        } catch (err: any) {
            console.error("CRITICAL ERROR inside checkout.session.completed:", err);
            return new NextResponse(`Webhook Error: ${err.message}`, { status: 500 });
        }
    }

    // 4. Handle Stripe Connect Account Updates (Onboarding)
    if (event.type === 'account.updated') {
        const account = event.data.object as Stripe.Account;

        if (account.metadata?.userId || account.id) {
            await connectToDatabase();

            // We can find by stripeConnectId (which is account.id)
            const user = await User.findOne({ stripeConnectId: account.id });

            if (user) {
                // Check if user has provided all necessary details
                const isComplete = account.details_submitted && account.charges_enabled;

                if (user.onboardingComplete !== isComplete) {
                    user.onboardingComplete = isComplete;
                    await user.save();
                    console.log(`Updated user ${user.clerkId} onboarding status to: ${isComplete}`);

                    // Revalidate to update UI immediately
                    const { revalidatePath } = await import('next/cache');
                    revalidatePath('/');
                }
            }
        }
    }

    return new NextResponse(null, { status: 200 });
}