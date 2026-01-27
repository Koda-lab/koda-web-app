"use client";

import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useCart } from "@/hooks/use-cart";
import { useFavorites } from "@/hooks/use-favorites";
import { removeFromFavorites } from "@/app/actions/favorites";
import { useLocalizedToast } from "@/hooks/use-localized-toast";
import { getPublicImageUrl } from "@/lib/image-helper";
import { IAutomation } from "@/types/automation";
import { useTransition } from "react";

interface FavoritesListProps {
    favorites: any[];
}

export function FavoritesList({ favorites }: FavoritesListProps) {
    const t = useTranslations('Favorites');
    const tCard = useTranslations('ProductCard');
    const { showSuccess, showError } = useLocalizedToast();
    const cart = useCart();
    const favoritesStore = useFavorites();
    const [isPending, startTransition] = useTransition();

    const handleRemove = (productId: string) => {
        startTransition(async () => {
            try {
                favoritesStore.removeFavorite(productId);
                await removeFromFavorites(productId);
                showSuccess("removedFromFavorites");
            } catch (error) {
                favoritesStore.addFavorite(productId);
                console.error("Failed to remove favorite:", error);
            }
        });
    };

    const handleAddToCart = (product: any) => {
        const exists = cart.items.some(item => item._id === product._id);
        if (exists) {
            showError(tCard('toast.alreadyInCart'));
            return;
        }
        cart.addItem(product as IAutomation);
        showSuccess("articleAddedToCart");
    };

    if (favorites.length === 0) {
        return (
            <Card className="border-border/50 bg-card shadow-lg border-dashed">
                <CardContent className="flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
                    <div className="p-4 bg-muted rounded-full mb-4">
                        <Heart className="h-8 w-8 text-muted-foreground opacity-20" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{t('empty')}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{t('emptyDesc')}</p>
                    <Button asChild variant="default" size="sm">
                        <Link href="/catalog">{t('browse')}</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-border/50 bg-card shadow-lg">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-500" />
                    {t('title')}
                    <span className="text-muted-foreground font-normal text-sm">
                        ({favorites.length})
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {favorites.map((product) => (
                    <div
                        key={product._id}
                        className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                    >
                        {/* Image */}
                        <Link href={`/product/${product._id}`} className="shrink-0">
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
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

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <Link href={`/product/${product._id}`}>
                                <h4 className="font-medium text-sm truncate hover:text-primary transition-colors">
                                    {product.title}
                                </h4>
                            </Link>
                            <p className="text-xs text-muted-foreground">
                                {product.category} • {product.platform}
                            </p>
                        </div>

                        {/* Price */}
                        <div className="text-right shrink-0">
                            <p className="font-bold text-sm">{product.price}€</p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-primary hover:text-primary"
                                onClick={() => handleAddToCart(product)}
                            >
                                <ShoppingCart className="h-4 w-4" />
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
            </CardContent>
        </Card>
    );
}
