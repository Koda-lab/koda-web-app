"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { ShoppingCart, Trash2, Loader2, LogIn, Tag, Plus } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { createCheckoutSession } from "@/app/actions/transaction";
import { getPublicImageUrl } from "@/lib/image-helper";
import { useLocalizedToast } from "@/hooks/use-localized-toast";
import { getMyOrders } from "@/app/actions/dashboard";
import { getSuggestedProducts } from "@/app/actions/products";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/app/components/ui/sheet";
import { Separator } from "@/app/components/ui/separator";
import { useTranslations } from "next-intl";

export default function CartSheet() {
    const t = useTranslations('CartSheet');
    const tCats = useTranslations('Categories');
    const { showSuccess, showError, showInfo } = useLocalizedToast();
    const [isMounted, setIsMounted] = useState(false);
    const [isPending, startTransition] = useTransition();

    // State
    const [purchasedIds, setPurchasedIds] = useState<Set<string> | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [prevItemCount, setPrevItemCount] = useState(0);
    const [promoCode, setPromoCode] = useState("");
    const [appliedDiscount, setAppliedDiscount] = useState<{ code: string, value: number } | null>(null);
    const [suggestions, setSuggestions] = useState<any[]>([]);

    const cart = useCart();
    const { userId } = useAuth();
    const router = useRouter();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // 1. Load Orders
    useEffect(() => {
        if (userId) {
            getMyOrders()
                .then((orders) => {
                    const productIds = orders.map((o: any) => {
                        if (!o.buyerId && !o.stripeId && o.title) return String(o._id);
                        if (o.productId && typeof o.productId === 'object' && o.productId._id) return String(o.productId._id);
                        if (o.productId) return String(o.productId);
                        return null;
                    }).filter((id): id is string => !!id);
                    setPurchasedIds(new Set(productIds));
                })
                .catch((err) => console.error("Error fetching orders", err));
        } else {
            setPurchasedIds(null);
        }
    }, [userId]);

    // 2. Remove Purchased/Own Items
    useEffect(() => {
        if (!isMounted || !purchasedIds || cart.items.length === 0 || !userId) return;

        const itemsToRemove = cart.items.filter(item => {
            const itemId = String(item._id).trim();
            const isPurchased = purchasedIds.has(itemId);
            const itemSellerId = typeof item.sellerId === 'object' && item.sellerId !== null
                ? String((item.sellerId as any)._id || item.sellerId)
                : String(item.sellerId);
            const isMyOwnProduct = itemSellerId === userId;
            return isPurchased || isMyOwnProduct;
        });

        if (itemsToRemove.length > 0) {
            const cleanItems = cart.items.filter(item => {
                const itemId = String(item._id).trim();
                const itemSellerId = typeof item.sellerId === 'object' && item.sellerId !== null
                    ? String((item.sellerId as any)._id || item.sellerId)
                    : String(item.sellerId);
                const isPurchased = purchasedIds.has(itemId);
                const isMyOwnProduct = itemSellerId === userId;
                return !isPurchased && !isMyOwnProduct;
            });
            cart.setItems(cleanItems);
            if (itemsToRemove.length === 1) showInfo('itemRemovedSingular', { title: itemsToRemove[0].title });
            else showInfo('itemsRemovedPlural', { count: itemsToRemove.length });
        }
    }, [purchasedIds, cart.items, isMounted, cart, userId]);

    // 3. Animation on Add
    useEffect(() => {
        if (cart.items.length > prevItemCount) {
            setIsAnimating(true);
            const timer = setTimeout(() => setIsAnimating(false), 300);
            return () => clearTimeout(timer);
        }
        setPrevItemCount(cart.items.length);
    }, [cart.items.length, prevItemCount]);

    // 4. Fetch Suggestions
    useEffect(() => {
        if (cart.items.length > 0) {
            const excludeIds = cart.items.map(i => i._id);
            const purchasedArray = purchasedIds ? Array.from(purchasedIds) : [];
            getSuggestedProducts(excludeIds, userId, purchasedArray).then(setSuggestions);
        } else {
            setSuggestions([]);
        }
    }, [cart.items.length, userId, purchasedIds]);

    if (!isMounted) return null;

    const subtotal = cart.items.reduce((total, item) => total + Number(item.price), 0);
    const total = appliedDiscount ? subtotal * (1 - appliedDiscount.value) : subtotal;

    const handleApplyPromo = () => {
        if (promoCode.toUpperCase() === "KODA20") {
            setAppliedDiscount({ code: "KODA20", value: 0.20 });
            showSuccess("Discount applied: -20%");
        } else {
            showError("Invalid promo code");
        }
    };

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
                <Button
                    variant="ghost"
                    className={`relative hover:bg-secondary/50 active:scale-95 transition-all duration-200 ${isAnimating ? 'scale-125 text-primary rotate-12 bg-primary/10' : ''}`}
                >
                    <ShoppingCart size={20} className={isAnimating ? 'animate-bounce' : ''} />
                    {cart.items.length > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center animate-in zoom-in">
                            {cart.items.length}
                        </span>
                    )}
                </Button>
            </SheetTrigger>

            <SheetContent className="z-[100] flex flex-col h-[calc(100%-2rem)] top-4 right-4 rounded-2xl border border-orange-500/20 shadow-2xl bg-background/80 backdrop-blur-xl sm:max-w-md overflow-hidden">
                <SheetHeader className="border-b pb-4 flex flex-row items-center justify-between">
                    <SheetTitle className="flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5" />
                        {t('title')} <span className="text-muted-foreground font-normal text-sm">({cart.items.length})</span>
                    </SheetTitle>
                    {cart.items.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-muted-foreground hover:text-destructive"
                            onClick={() => cart.removeAll()}
                        >
                            <Trash2 className="mr-2 h-3 w-3" />
                            {t('clearAll')}
                        </Button>
                    )}
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
                        <>
                            {cart.items.map((item) => (
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
                                                {item.category === "Social Media" ? tCats('socialMedia') :
                                                    item.category === "Email Marketing" ? tCats('emailMarketing') :
                                                        item.category === "Productivity" ? tCats('productivity') :
                                                            item.category === "Sales" ? tCats('sales') :
                                                                item.category === "Other" ? tCats('other') : (item.category || "Automation")}
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
                            ))}

                            {/* Suggestions Section */}
                            {suggestions.length > 0 && (
                                <div className="mt-4 pt-4 border-t">
                                    <h4 className="text-xs font-bold uppercase text-muted-foreground mb-3 tracking-wider">{t('youMightLike')}</h4>
                                    <div className="space-y-3">
                                        {suggestions.map((product) => (
                                            <div key={product._id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 border border-transparent hover:border-primary/20 hover:bg-secondary/50 transition-all">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="h-10 w-10 bg-muted rounded flex items-center justify-center shrink-0 overflow-hidden">
                                                        {product.previewImageUrl && (
                                                            <img src={getPublicImageUrl(product.previewImageUrl)} alt={product.title} className="h-full w-full object-cover" />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-sm font-medium truncate">{product.title}</span>
                                                        <span className="text-xs text-muted-foreground">{product.price}€</span>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 rounded-full hover:bg-primary hover:text-white"
                                                    onClick={() => {
                                                        cart.addItem(product);
                                                        showSuccess('addedToCart');
                                                    }}
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {cart.items.length > 0 && (
                    <div className="border-t pt-6 px-6 pb-6 mt-auto bg-background">
                        {/* Promo Code Section */}
                        <div className="flex gap-2 mb-6">
                            <div className="relative flex-1">
                                <Tag className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={t('codePlaceholder')}
                                    className="pl-9 bg-muted/50 border-input/50 focus-visible:bg-background transition-all"
                                    value={promoCode}
                                    onChange={(e) => setPromoCode(e.target.value)}
                                    disabled={!!appliedDiscount}
                                />
                            </div>
                            <Button variant="outline" onClick={handleApplyPromo} disabled={!!appliedDiscount || !promoCode}>
                                {t('apply')}
                            </Button>
                        </div>

                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>{t('subtotal')}</span>
                                <span>{subtotal.toFixed(2)} €</span>
                            </div>

                            {/* Discount Line */}
                            {appliedDiscount && (
                                <div className="flex justify-between text-sm text-green-600 font-medium animate-in slide-in-from-left-2">
                                    <span className="flex items-center gap-1">
                                        <Tag className="h-3 w-3" /> {t('discount')} ({appliedDiscount.code})
                                    </span>
                                    <span>-{(subtotal * appliedDiscount.value).toFixed(2)} €</span>
                                </div>
                            )}

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