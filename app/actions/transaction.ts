"use server";

import Stripe from "stripe";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/db";
import Automation from "@/models/Automation";
import User from "@/models/User"; // Gardé pour vérification, même si on ne transfère pas tout de suite
import { redirect } from "next/navigation";
import { getPublicImageUrl } from "@/lib/image-helper";
import { IAutomation } from "@/types/automation"; // Assure-toi d'avoir cet import
import { checkRateLimit } from "@/lib/ratelimit";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function createCheckoutSession(items: IAutomation[]) {
    // 1. Vérification Utilisateur
    const { userId } = await auth();
    if (!userId) {
        redirect("/sign-in");
    }

    // Rate Limiting
    const { success } = await checkRateLimit(userId);
    if (!success) {
        throw new Error("Trop de requêtes. Veuillez réessayer dans quelques secondes.");
    }

    // 2. Vérification URL de l'app
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl || !/^https?:\/\//.test(appUrl)) {
        throw new Error("NEXT_PUBLIC_APP_URL manquant ou invalide (ex: https://ton-domaine.com).");
    }

    if (!items || items.length === 0) {
        throw new Error("Le panier est vide.");
    }

    await connectToDatabase();

    // 3. Récupération sécurisée des produits (On ne fait pas confiance au frontend pour le prix)
    const productIds = items.map((item) => item._id);

    // On cherche tous les produits qui ont ces IDs
    const dbProducts = await Automation.find({ _id: { $in: productIds } }).lean();

    if (!dbProducts || dbProducts.length === 0) {
        throw new Error("Aucun produit valide trouvé dans la base de données.");
    }

    // 4. (Optionnel mais recommandé) Vérifier que les vendeurs existent et ont Stripe activé
    // Pour un MVP, on peut aussi laisser le webhook gérer les erreurs, mais c'est mieux de bloquer ici.
    const sellerIds = [...new Set(dbProducts.map(p =>
        typeof p.sellerId === "object" ? p.sellerId.toString() : p.sellerId
    ))];

    const sellers = await User.find({ clerkId: { $in: sellerIds } });

    // Vérification simple : est-ce que tous les vendeurs ont connecté Stripe ?
    for (const seller of sellers) {
        if (!seller.stripeConnectId) {
            throw new Error(`Le vendeur ${seller.username || 'inconnu'} n'a pas configuré ses paiements.`);
        }
    }

    // 5. Construction des "Line Items" pour Stripe
    const line_items = dbProducts.map((product) => {
        // Gestion de l'image
        const candidateImageUrl = product.previewImageUrl ? getPublicImageUrl(product.previewImageUrl) : "";
        const imageUrl = typeof candidateImageUrl === "string" ? candidateImageUrl.trim() : "";
        const images = /^https:\/\//.test(imageUrl) ? [imageUrl] : [];

        return {
            price_data: {
                currency: "eur",
                product_data: {
                    name: product.title,
                    description: product.description ? product.description.substring(0, 100) + "..." : undefined,
                    images: images,
                    metadata: {
                        productId: product._id.toString(),
                        sellerId: product.sellerId.toString()
                    }
                },
                unit_amount: Math.round(product.price * 100), // Prix en centimes
            },
            quantity: 1,
        };
    });

    // 6. Création de la Session
    // NOTE IMPORTANTE : Pour un panier multi-vendeurs, on ne peut PAS utiliser "transfer_data" ici.
    // L'argent va aller sur le compte de la plateforme (Koda).
    // Tu devras utiliser un Webhook pour transférer les 85% aux vendeurs respectifs après paiement.

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: line_items,
        mode: "payment",
        metadata: {
            userId: userId,
            // On stocke la liste des IDs pour le traitement après-vente (Webhook)
            productIds: JSON.stringify(productIds),
            type: "cart_checkout"
        },
        success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/`, // Retour à l'accueil en cas d'annulation
    });

    const url = (session.url ?? "").trim();
    if (!url || (!url.startsWith("/") && !/^https?:\/\//.test(url))) {
        throw new Error("Stripe n'a pas retourné une URL de checkout valide.");
    }

    return { url }; // Je renvoie un objet pour être cohérent avec l'appel côté client
}

/**
 * Helper function for single product purchase (product detail page)
 * Wraps createCheckoutSession to work with a single product ID
 */
export async function createSingleProductCheckout(productId: string): Promise<string> {
    await connectToDatabase();

    // Fetch the product from DB
    const product = await Automation.findById(productId).lean();

    if (!product) {
        throw new Error("Produit introuvable.");
    }

    // Convert to IAutomation format for checkout
    const automationItem: IAutomation = {
        _id: product._id.toString(),
        title: product.title,
        description: product.description,
        price: product.price,
        category: product.category,
        tags: product.tags || [],
        previewImageUrl: product.previewImageUrl,
        sellerId: typeof product.sellerId === 'object' ? product.sellerId.toString() : product.sellerId,
        createdAt: product.createdAt,
        platform: product.platform,
        fileUrl: product.fileUrl,
        version: product.version,
    };

    // Call the multi-item checkout with single item array
    const { url } = await createCheckoutSession([automationItem]);
    return url;
}