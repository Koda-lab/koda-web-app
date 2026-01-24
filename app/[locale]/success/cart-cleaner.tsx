"use client";

import { useEffect } from "react";
import { useCart } from "@/hooks/use-cart";
import { syncCart } from "@/app/actions/cart";

export default function CartCleaner() {
    const cart = useCart();

    useEffect(() => {
        if (cart.items.length > 0) {
            console.log("Paiement réussi : Nettoyage du panier...");
            cart.removeAll();
            syncCart([]); // Vide aussi la BDD
        }
    }, [cart]);

    return null; // Ce composant ne rend rien visuellement
}