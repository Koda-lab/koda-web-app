// app/components/cart/cart-sheet.tsx
"use client";

import { ShoppingCart, Trash2, Loader2 } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/app/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/app/components/ui/sheet";
import { Separator } from "@/app/components/ui/separator";
import { useEffect, useState, useTransition } from "react";
// Import de notre nouvelle action serveur
import { createCheckoutSession } from "@/app/actions/transaction";
import { toast } from "sonner";

export default function CartSheet() {
    const [isMounted, setIsMounted] = useState(false);
    const [isPending, startTransition] = useTransition(); //Pour gérer le chargement
    const cart = useCart();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    const total = cart.items.reduce((total, item) => total + Number(item.price), 0);

    // La fonction qui déclenche le paiement
    const onCheckout = async () => {
        startTransition(async () => {
            try {
                const { url } = await createCheckoutSession(cart.items);
                if (url) {
                    window.location.href = url; // Redirection vers Stripe
                } else {
                    toast.error("Erreur lors de la création du paiement.");
                }
            } catch (error) {
                console.error(error);
                toast.error("Une erreur est survenue.");
            }
        });
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" className="relative">
                    <ShoppingCart size={20} />
                    {cart.items.length > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                            {cart.items.length}
                        </span>
                    )}
                </Button>
            </SheetTrigger>
            {/*  Ajout de z-[100] pour être sûr qu'il passe au dessus du header */}
            <SheetContent className="z-[100] flex flex-col h-full">
                <SheetHeader>
                    <SheetTitle>Mon Panier ({cart.items.length})</SheetTitle>
                </SheetHeader>

                <div className="mt-8 flex flex-col gap-4 flex-grow overflow-y-auto">
                    {cart.items.length === 0 && (
                        <p className="text-muted-foreground text-center my-10">Votre panier est vide.</p>
                    )}

                    {cart.items.map((item) => (
                        <div key={item._id} className="flex justify-between items-center bg-secondary/20 p-3 rounded-lg">
                            <div className="flex flex-col gap-1 overflow-hidden">
                                <span className="font-semibold truncate text-sm">{item.title}</span>
                                <span className="text-xs text-muted-foreground">{item.price} €</span>
                            </div>
                            <Button
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => cart.removeItem(item._id)}
                            >
                                <Trash2 size={14} />
                            </Button>
                        </div>
                    ))}
                </div>

                {cart.items.length > 0 && (
                    <div className="pt-4 mt-auto">
                        <Separator className="my-4" />
                        <div className="flex justify-between items-center mb-4">
                            <span className="font-bold">Total:</span>
                            <span className="font-bold text-lg">{total.toFixed(2)} €</span>
                        </div>

                        {/* Bouton mis à jour */}
                        <Button
                            className="w-full"
                            onClick={onCheckout}
                            disabled={isPending} // Désactivé pendant le chargement
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Préparation...
                                </>
                            ) : (
                                "Passer au paiement"
                            )}
                        </Button>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}