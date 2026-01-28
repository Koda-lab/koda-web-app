"use client";

import { useEffect, useState, useTransition } from "react";
import { Heart, Trash2, ShoppingCart, ArrowRight, Check } from "lucide-react";
import { useFavorites } from "@/hooks/use-favorites";
import { useCart } from "@/hooks/use-cart";
import { getMyFavorites, removeFromFavorites } from "@/app/actions/favorites";
import { getPublicImageUrl } from "@/lib/image-helper";
import { useLocalizedToast } from "@/hooks/use-localized-toast";
import { useAuth } from "@clerk/nextjs";

import { Button } from "@/app/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/app/components/ui/sheet";
import { Separator } from "@/app/components/ui/separator";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export default function FavoritesSheet() {
    const t = useTranslations('Favorites');
    const tCats = useTranslations('Categories');
    const { showSuccess, showError, showInfo } = useLocalizedToast();

    const [isMounted, setIsMounted] = useState(false);
    const [favorites, setFavorites] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isPending, startTransition] = useTransition();

    const favoritesStore = useFavorites();
    const cart = useCart();
    const { userId } = useAuth();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Load favorites when sheet opens
    const loadFavorites = async () => {
        if (!userId) return;
        setIsLoading(true);
        try {
            const data = await getMyFavorites();
            setFavorites(data);
        } catch (error) {
            console.error("Failed to load favorites:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemove = (productId: string) => {
        startTransition(async () => {
            try {
                favoritesStore.removeFavorite(productId);
                setFavorites(prev => prev.filter(f => f._id !== productId));
                await removeFromFavorites(productId);
                showSuccess("removedFromFavorites");
            } catch (error) {
                favoritesStore.addFavorite(productId);
                console.error("Failed to remove favorite:", error);
            }
        });
    };

    const handleToggleCart = (product: any) => {
        const exists = cart.items.some(item => item._id === product._id);
        if (exists) {
            cart.removeItem(product._id);
            showSuccess("articleRemoved");
        } else {
            cart.addItem(product);
            showSuccess("articleAddedToCart");
        }
    };

    if (!isMounted) return null;

    return (
        <Sheet onOpenChange={(open) => open && loadFavorites()}>
            <SheetTrigger asChild>
                <Button
                    variant="ghost"
                    className="relative hover:bg-secondary/50 active:scale-95 transition-all duration-200"
                >
                    <Heart
                        size={20}
                        className={`transition-all ${favoritesStore.favoriteIds.length > 0 ? 'fill-red-500 text-red-500' : ''}`}
                    />
                    {favoritesStore.favoriteIds.length > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center animate-in zoom-in">
                            {favoritesStore.favoriteIds.length}
                        </span>
                    )}
                </Button>
            </SheetTrigger>

            <SheetContent className="z-[100] flex flex-col h-[calc(100%-1rem)] sm:h-[calc(100%-2rem)] top-2 right-2 left-2 sm:left-auto sm:top-4 sm:right-4 rounded-2xl border border-red-500/20 shadow-2xl bg-background/80 backdrop-blur-xl w-auto sm:w-full sm:max-w-md overflow-hidden">
                <SheetHeader className="border-b pb-4 flex flex-row items-center justify-between">
                    <SheetTitle className="flex items-center gap-2">
                        <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                        {t('title')} <span className="text-muted-foreground font-normal text-sm">({favoritesStore.favoriteIds.length})</span>
                    </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col gap-4 flex-grow overflow-y-auto py-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin h-6 w-6 border-2 border-red-500 border-t-transparent rounded-full" />
                        </div>
                    ) : favorites.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
                            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                                <Heart size={32} className="text-muted-foreground opacity-30" />
                            </div>
                            <div>
                                <p className="text-lg font-semibold">{t('empty')}</p>
                                <p className="text-sm text-muted-foreground">{t('emptyDesc')}</p>
                            </div>
                            <SheetClose asChild>
                                <Button asChild variant="default" size="sm">
                                    <Link href="/catalog">{t('browse')}</Link>
                                </Button>
                            </SheetClose>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {favorites.map((product) => (
                                <div
                                    key={product._id}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all group"
                                >
                                    {/* Image */}
                                    <SheetClose asChild>
                                        <Link href={`/product/${product._id}`} className="shrink-0">
                                            <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted">
                                                {product.previewImageUrl ? (
                                                    <img
                                                        src={getPublicImageUrl(product.previewImageUrl)}
                                                        alt={product.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                                                        Koda
                                                    </div>
                                                )}
                                            </div>
                                        </Link>
                                    </SheetClose>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <SheetClose asChild>
                                            <Link href={`/product/${product._id}`}>
                                                <h4 className="font-medium text-sm truncate hover:text-primary transition-colors">
                                                    {product.title}
                                                </h4>
                                            </Link>
                                        </SheetClose>
                                        <p className="text-xs text-muted-foreground">
                                            {product.category === "Social Media" ? tCats('socialMedia') :
                                                product.category === "Email Marketing" ? tCats('emailMarketing') :
                                                    product.category === "Productivity" ? tCats('productivity') :
                                                        product.category === "Sales" ? tCats('sales') : product.category}
                                        </p>
                                        <p className="text-sm font-bold text-primary mt-0.5">{product.price}€</p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={`h-8 w-8 ${cart.items.some(i => i._id === product._id) ? 'text-green-500 hover:bg-green-500/10' : 'text-primary hover:bg-primary/10'}`}
                                            onClick={() => handleToggleCart(product)}
                                        >
                                            {cart.items.some(i => i._id === product._id) ? (
                                                <Check className="h-4 w-4" />
                                            ) : (
                                                <ShoppingCart className="h-4 w-4" />
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                            onClick={() => handleRemove(product._id)}
                                            disabled={isPending}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {favorites.length > 0 && (
                    <>
                        <Separator />
                        <div className="pt-4 space-y-3">
                            <SheetClose asChild>
                                <Button asChild variant="outline" className="w-full">
                                    <Link href="/dashboard" className="flex items-center justify-center gap-2">
                                        {t('title')}
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </SheetClose>
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}
