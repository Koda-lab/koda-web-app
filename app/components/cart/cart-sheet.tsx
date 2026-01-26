"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { ShoppingCart, Trash2, Loader2, LogIn } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { createCheckoutSession } from "@/app/actions/transaction";
import { getPublicImageUrl } from "@/lib/image-helper";
import { useLocalizedToast } from "@/hooks/use-localized-toast";
import { getMyOrders } from "@/app/actions/dashboard";

import { Button } from "@/app/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/app/components/ui/sheet";
import { Separator } from "@/app/components/ui/separator";
import { useTranslations } from "next-intl";

export default function CartSheet() {
    const t = useTranslations('CartSheet');
    const { showSuccess, showError, showInfo, showLoading, dismiss } = useLocalizedToast();
    const [isMounted, setIsMounted] = useState(false);
    const [isPending, startTransition] = useTransition();

    // Set pour stocker les IDs des produits déjà achetés
    const [purchasedIds, setPurchasedIds] = useState<Set<string> | null>(null);

    const cart = useCart();
    const { userId } = useAuth();
    const router = useRouter();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // 1. Chargement des achats à la connexion
    useEffect(() => {
        if (userId) {
            getMyOrders()
                .then((orders) => {
                    // Extraction robuste des IDs produits
                    const productIds = orders.map((o: any) => {
                        // Cas A: L'objet est directement un produit
                        if (!o.buyerId && !o.stripeId && o.title) {
                            return String(o._id);
                        }

                        // Cas B: C'est une commande peuplée avec un objet produit
                        if (o.productId && typeof o.productId === 'object' && o.productId._id) {
                            return String(o.productId._id);
                        }

                        // Cas C: C'est une commande avec juste l'ID
                        if (o.productId) {
                            return String(o.productId);
                        }

                        return null;
                    }).filter((id): id is string => !!id);

                    setPurchasedIds(new Set(productIds));
                })
                .catch((err) => {
                    console.error("Erreur récupération achats", err);
                });
        } else {
            setPurchasedIds(null);
        }
    }, [userId]);

    // 2. Nettoyage automatique du panier (Achats + Propres produits)
    useEffect(() => {
        // Sécurité : on attend que tout soit prêt (composant, user, liste achats)
        if (!isMounted || !purchasedIds || cart.items.length === 0 || !userId) return;

        // Identification des doublons (Déjà acheté OU Je suis le vendeur)
        const itemsToRemove = cart.items.filter(item => {
            const itemId = String(item._id).trim();
            const isPurchased = purchasedIds.has(itemId);

            // Vérification robuste du vendeur (String vs Object)
            const itemSellerId = typeof item.sellerId === 'object' && item.sellerId !== null
                ? String((item.sellerId as any)._id || item.sellerId)
                : String(item.sellerId);

            const isMyOwnProduct = itemSellerId === userId;

            // On retire si l'un des deux cas est vrai
            return isPurchased || isMyOwnProduct;
        });

        if (itemsToRemove.length > 0) {
            // Filtrage : on garde uniquement ce qui est valide (Ni acheté, ni à moi)
            const cleanItems = cart.items.filter(item => {
                const itemId = String(item._id).trim();

                const itemSellerId = typeof item.sellerId === 'object' && item.sellerId !== null
                    ? String((item.sellerId as any)._id || item.sellerId)
                    : String(item.sellerId);

                const isPurchased = purchasedIds.has(itemId);
                const isMyOwnProduct = itemSellerId === userId;

                return !isPurchased && !isMyOwnProduct;
            });

            // Mise à jour du store
            cart.setItems(cleanItems);

            // Notification utilisateur adaptée
            if (itemsToRemove.length === 1) {
                showInfo('itemRemovedSingular', { title: itemsToRemove[0].title });
            } else {
                showInfo('itemsRemovedPlural', { count: itemsToRemove.length });
            }
        }
    }, [purchasedIds, cart.items, isMounted, cart, userId]);


    if (!isMounted) return null;

    const total = cart.items.reduce((total, item) => total + Number(item.price), 0);

    const onCheckout = async () => {
        if (!userId) {
            showInfo('loginCheckout');
            router.push("/sign-in");
            return;
        }

        startTransition(async () => {
            try {
                const { url } = await createCheckoutSession(cart.items);
                if (url) window.location.href = url;
            } catch (error: any) {
                console.error(error);
                showError(error.message || "An error occurred while preparing the payment.");
            }
        });
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" className="relative hover:bg-secondary/50 active:scale-95 transition-transform duration-200">
                    <ShoppingCart size={20} />
                    {cart.items.length > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center animate-in zoom-in">
                            {cart.items.length}
                        </span>
                    )}
                </Button>
            </SheetTrigger>

            <SheetContent className="z-[100] flex flex-col h-[calc(100%-2rem)] top-4 right-4 rounded-2xl border border-orange-500/20 shadow-2xl bg-background/80 backdrop-blur-xl sm:max-w-md overflow-hidden">
                <SheetHeader className="border-b pb-4">
                    <SheetTitle className="flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5" />
                        {t('title')} <span className="text-muted-foreground font-normal text-sm">({cart.items.length})</span>
                    </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col gap-4 flex-grow overflow-y-auto py-6">
                    {cart.items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-60">
                            <ShoppingCart className="h-12 w-12 text-muted-foreground" />
                            <p className="text-muted-foreground font-medium">{t('empty')}</p>
                            <SheetClose asChild>
                                <Button variant="outline" size="sm">
                                    {t('continue')}
                                </Button>
                            </SheetClose>
                        </div>
                    ) : (
                        cart.items.map((item) => (
                            <div key={item._id} className="flex gap-4 p-3 bg-card border rounded-lg hover:shadow-sm transition-all group">
                                <div className="h-16 w-16 bg-muted rounded-md flex items-center justify-center shrink-0 overflow-hidden">
                                    {item.previewImageUrl ? (
                                        <img
                                            src={getPublicImageUrl(item.previewImageUrl)}
                                            alt={item.title}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-xs font-bold text-muted-foreground">Koda</span>
                                    )}
                                </div>

                                <div className="flex flex-col justify-between flex-grow">
                                    <div className="flex justify-between items-start">
                                        <span className="font-semibold text-sm line-clamp-2 leading-tight">{item.title}</span>
                                        <span className="font-bold text-sm ml-2 whitespace-nowrap">{item.price} €</span>
                                    </div>
                                    <div className="flex justify-between items-end mt-2">
                                        <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                                            {item.category || "Automation"}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => {
                                                cart.removeItem(item._id);
                                                showSuccess('articleRemoved');
                                            }}
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {cart.items.length > 0 && (
                    <div className="border-t pt-6 px-6 pb-6 mt-auto bg-background">
                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>{t('subtotal')}</span>
                                <span>{total.toFixed(2)} €</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center font-bold text-lg">
                                <span>{t('total')}</span>
                                <span className="text-primary">{total.toFixed(2)} €</span>
                            </div>
                        </div>

                        <Button
                            className="w-full h-11 text-base shadow-lg"
                            onClick={onCheckout}
                            disabled={isPending}
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t('loading')}
                                </>
                            ) : !userId ? (
                                <>
                                    <LogIn className="mr-2 h-4 w-4" />
                                    {t('login')}
                                </>
                            ) : (
                                t('checkout')
                            )}
                        </Button>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}