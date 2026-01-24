// app/actions/cart.ts
"use server";

import { requireAuth, requireUser } from "@/lib/auth-utils";
import User from "@/models/User";
import Automation from "@/models/Automation"; // Important pour que la 'ref' fonctionne
import { IAutomation } from "@/types/automation";

// Récupérer le panier depuis la BDD
export async function getSavedCart(): Promise<IAutomation[]> {
    const userId = await requireAuth();

    // On cherche l'utilisateur et on "populate" (remplit) le champ cart avec les vrais objets produits
    const user = await User.findOne({ clerkId: userId }).populate("cart").lean();

    if (!user || !user.cart) return [];

    // Conversion propre des données pour le client
    const cartItems = user.cart as unknown as any[];

    return cartItems.map((item) => ({
        ...item,
        _id: item._id.toString(),
        createdAt: item.createdAt ? item.createdAt.toISOString() : new Date().toISOString(),
        sellerId: item.sellerId.toString(),
        // On s'assure que category est valide, sinon "Autre" par défaut
        category: item.category || "Autre"
    }));
}

// Sauvegarder le panier dans la BDD
export async function syncCart(items: IAutomation[]) {
    const userId = await requireUser();

    const productIds = items.map((item) => item._id);

    await User.findOneAndUpdate(
        { clerkId: userId },
        { $set: { cart: productIds } }
    );
}