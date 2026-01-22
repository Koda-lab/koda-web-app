"use server";

import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/db";
import Automation from "@/models/Automation";
import Purchase from "@/models/Purchase";
import User from "@/models/User";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

/**
 * Récupère les produits mis en vente par le vendeur connecté.
 */
export async function getMyProducts() {
    const { userId } = await auth();
    if (!userId) return [];

    await connectToDatabase();

    // On convertit en objets JS simples avec lean() pour éviter les problèmes de sérialisation
    const products = await Automation.find({ sellerId: userId }).sort({ createdAt: -1 }).lean();

    // Conversion manuelle des IDs en string pour éviter les erreurs "Only plain objects..."
    return products.map(product => ({
        ...product,
        _id: product._id.toString(),
        price: product.price,
    }));
}

/**
 * Récupère l'historique des ventes du vendeur.
 */
export async function getSalesHistory() {
    const { userId } = await auth();
    if (!userId) return [];

    await connectToDatabase();

    const purchases = await Purchase.find({ sellerId: userId })
        .populate("productId", "title") // On peuple le titre du produit
        .sort({ createdAt: -1 })
        .lean();

    return purchases.map(purchase => ({
        ...purchase,
        _id: purchase._id.toString(),
        productId: purchase.productId ? { title: (purchase.productId as any).title } : { title: "Produit supprimé" },
        createdAt: purchase.createdAt.toISOString(),
    }));
}

/**
 * Récupère la balance Stripe du vendeur (Fonds disponibles et en attente).
 */
export async function getSellerBalance() {
    const { userId } = await auth();
    if (!userId) return null;

    await connectToDatabase();
    const user = await User.findOne({ clerkId: userId });

    if (!user || !user.stripeConnectId) return null;

    try {
        const balance = await stripe.balance.retrieve({
            stripeAccount: user.stripeConnectId,
        });

        return {
            available: balance.available[0]?.amount / 100 || 0,
            pending: balance.pending[0]?.amount / 100 || 0,
            currency: balance.available[0]?.currency.toUpperCase() || "EUR",
        };
    } catch (error) {
        console.error("Erreur lors de la récupération de la balance Stripe:", error);
        return null;
    }
}

/**
 * Récupère les achats de l'utilisateur (en tant qu'acheteur).
 */
export async function getMyOrders() {
    const { userId } = await auth();
    if (!userId) return [];

    await connectToDatabase();

    const orders = await Purchase.find({ buyerId: userId })
        .populate("productId", "title price previewImageUrl") // On peuple les infos du produit
        .sort({ createdAt: -1 })
        .lean();

    return orders.map(order => ({
        ...order,
        _id: order._id.toString(),
        productId: order.productId ? {
            _id: (order.productId as any)._id.toString(),
            title: (order.productId as any).title,
            price: (order.productId as any).price,
            previewImageUrl: (order.productId as any).previewImageUrl,
        } : null,
        createdAt: order.createdAt.toISOString(),
    }));
}
