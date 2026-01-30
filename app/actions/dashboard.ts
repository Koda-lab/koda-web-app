"use server";

import { requireAuth, requireUser } from "@/lib/auth-utils";
import { connectToDatabase } from "@/lib/db";
import Automation from "@/models/Automation";
import Purchase from "@/models/Purchase";
import User from "@/models/User";
import Stripe from "stripe";
import { IProduct } from "@/types/product";
import { Product } from "@/models/Product";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

/**
 * Récupère les produits mis en vente par le vendeur connecté.
 */
export async function getMyProducts(): Promise<IProduct[]> {
    const user = await requireUser();
    const userId = user.clerkId;


    // On convertit en objets JS simples avec lean() pour éviter les problèmes de sérialisation
    const products = await Product.find({ sellerId: userId }).sort({ createdAt: -1 }).lean();

    // Conversion manuelle des IDs en string pour éviter les erreurs "Only plain objects..."
    return products.map((product: any) => ({
        ...product,
        _id: product._id.toString(),
        createdAt: product.createdAt,
    })) as IProduct[];
}

/**
 * Récupère l'historique des ventes du vendeur.
 */
export async function getSalesHistory() {
    const user = await requireUser();
    const userId = user.clerkId;


    await connectToDatabase();

    const purchases = await Purchase.find({ sellerId: userId })
        .populate("productId", "title") // On peuple le titre du produit
        .sort({ createdAt: -1 })
        .lean();

    return purchases.map((purchase: any) => ({
        ...purchase,
        _id: purchase._id.toString(),
        productId: purchase.productId ? { title: purchase.productId.title } : { title: "Deleted product" },
        createdAt: purchase.createdAt.toISOString(),
    }));
}

/**
 * Récupère la balance Stripe du vendeur (Fonds disponibles et en attente).
 */
export async function getSellerBalance() {
    let user;
    try {
        user = await requireUser();
    } catch (err) {
        return null; // Silent fail for balance display
    }

    if (!user.stripeConnectId) return null;

    try {
        // 1. Vérifier le statut du compte Stripe
        const account = await stripe.accounts.retrieve(user.stripeConnectId);

        // Si le compte n'est pas complètement configuré (onboarding inachevé)
        if (!account.details_submitted) {
            return null; // Cela forcera l'affichage du bouton "Configurer mes paiements"
        }

        // 2. Récupérer la balance
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
        return null; // Fail gracefully
    }
}

/**
 * Récupère le montant total des ventes (brut) via la base de données.
 */
export async function getTotalEarnings(): Promise<number> {
    const user = await requireUser();
    const userId = user.clerkId;
    await connectToDatabase();

    const result = await Purchase.aggregate([
        { $match: { sellerId: userId } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    return result.length > 0 ? result[0].total : 0;
}

/**
 * Récupère les achats de l'utilisateur (en tant qu'acheteur).
 */
export async function getMyOrders() {
    const user = await requireUser();
    const userId = user.clerkId;


    await connectToDatabase();

    const orders = await Purchase.find({ buyerId: userId })
        .populate("productId", "title price previewImageUrl") // On peuple les infos du produit
        .sort({ createdAt: -1 })
        .lean();

    return orders.map((order: any) => ({
        ...order,
        _id: order._id.toString(),
        productId: order.productId ? {
            _id: order.productId._id.toString(),
            title: order.productId.title,
            price: order.productId.price,
            previewImageUrl: order.productId.previewImageUrl,
        } : null,
        createdAt: order.createdAt.toISOString(),
    }));
}
