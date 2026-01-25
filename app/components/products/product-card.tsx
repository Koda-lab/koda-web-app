"use client";

import { Link } from '@/i18n/routing';
import { Card, CardContent, CardFooter, CardHeader } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { ShoppingCart, Eye, Check, Star, ShieldCheck } from "lucide-react"; // <--- AJOUT DE STAR
import { useCart } from "@/hooks/use-cart";
import { IAutomation } from "@/types/automation";
import { IProduct } from "@/types/product";
import { PlatformIcon } from "@/app/components/icons/platform-icon";
import { useLocalizedToast } from "@/hooks/use-localized-toast";
import { getErrorKey } from "@/lib/error-translator";
import { useTranslations } from "next-intl";

type ProductLike = IProduct | IAutomation;

interface ProductCardProps {
    product: ProductLike;
    userId?: string | null;
    isPurchased?: boolean;
}

function isAutomation(p: ProductLike): p is IAutomation {
    return "platform" in p && "fileUrl" in p;
}

export function ProductCard({ product, userId, isPurchased = false }: ProductCardProps) {
    const { showSuccess, showError } = useLocalizedToast();
    const t = useTranslations('ProductCard');
    const cart = useCart();
    const isOwner = userId === product.sellerId;
    const automation = isAutomation(product);

    // Sécurisation des valeurs par défaut
    const rating = product.averageRating || 0;
    const reviewCount = product.reviewCount || 0;

    const onAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (!automation) {
            showError(t('toast.cannotAdd'));
            return;
        }

        if (isOwner) {
            showError(t('toast.ownProduct'));
            return;
        }

        if (isPurchased) {
            showError(t('toast.alreadyOwned'));
            return;
        }

        if (cart.items.some(item => item._id === product._id)) {
            cart.removeItem(product._id);
            showSuccess('articleRemoved');
        } else {
            cart.addItem(product as any);
            showSuccess('articleAddedToCart');
        }
    };

    return (
        <Card className="flex flex-col h-full hover:shadow-xl transition-all duration-300 border-border/50 group overflow-hidden relative">
            {/* Image Preview / Gradient Fallback */}
            <div className="relative w-full aspect-video bg-muted overflow-hidden">
                {product.previewImageUrl ? (
                    <img
                        src={product.previewImageUrl}
                        alt={product.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/30 flex items-center justify-center">
                        <span className="text-4xl opacity-20 font-black tracking-tighter select-none">
                            Koda<span className="text-orange-500">.</span>
                        </span>
                    </div>
                )}

                {/* Quick View Overlay Button */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Button
                        asChild
                        variant="secondary"
                        size="sm"
                        className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300 shadow-lg"
                    >
                        <Link href={`/product/${product._id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            {t('quickView')}
                        </Link>
                    </Button>
                </div>

                {/* Badge Category (Top Left) */}
                <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="backdrop-blur-md bg-background/80 hover:bg-background/90 shadow-sm">
                        {product.category}
                    </Badge>
                </div>

                {/* Badge Certification (Top Right) */}
                {product.isCertified && (
                    <div className="absolute top-2 right-2">
                        <Badge className="bg-green-600 hover:bg-green-700 text-white border-none shadow-lg gap-1.5 py-1 px-2.5">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">{t('certified')}</span>
                        </Badge>
                    </div>
                )}
            </div>

            <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-center mb-1">
                    {/* Platform (only for automations) */}
                    {automation ? (
                        <div className="flex items-center gap-2">
                            <PlatformIcon platform={product.platform} className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                                {product.platform}
                            </span>
                        </div>
                    ) : (
                        <div />
                    )}

                    <span className="font-bold text-lg text-primary">{product.price} €</span>
                </div>

                <h3 className="font-bold text-lg leading-tight line-clamp-1 group-hover:text-primary transition-colors mb-1">
                    {product.title}
                </h3>

                {/* --- BLOC AVIS (Integration demandée) --- */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                    <Star className={`w-3 h-3 ${rating > 0 ? "fill-primary text-primary" : "text-muted-foreground/40"}`} />
                    <span className={`font-medium ${rating > 0 ? "text-foreground" : ""}`}>
                        {rating > 0 ? rating : t('new', { defaultMessage: 'Nouveau' })}
                    </span>
                    {reviewCount > 0 && <span>({reviewCount})</span>}
                </div>

                {/* Seller Info */}
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <span>{t('offeredBy')}</span>
                    <span className="font-medium text-foreground hover:underline cursor-pointer">
                        {product.seller?.username || "Vendeur"}
                    </span>
                </div>
            </CardHeader>

            <CardContent className="p-4 pt-2 flex-grow">
                <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">{product.description}</p>
            </CardContent>

            <CardFooter className="p-4 pt-0 mt-auto">
                <Button
                    onClick={onAddToCart}
                    className={`w-full shadow-sm transition-all ${isPurchased
                        ? "bg-green-500/10 text-green-600 border-green-200 hover:bg-green-500/20 disabled:opacity-100"
                        : "bg-primary/90 hover:bg-primary"
                        }`}
                    disabled={isOwner || !automation || isPurchased}
                    variant={isPurchased ? "outline" : "default"}
                >
                    {isOwner ? (
                        <>
                            <ShoppingCart className="mr-2 h-4 w-4 opacity-50" />
                            {t('yourProduct')}
                        </>
                    ) : isPurchased ? (
                        <>
                            <Check className="mr-2 h-4 w-4" />
                            {t('alreadyPurchased')}
                        </>
                    ) : !automation ? (
                        <>
                            <ShoppingCart className="mr-2 h-4 w-4 opacity-50" />
                            {t('unavailable')}
                        </>
                    ) : (
                        <>
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            {t('addToCart')}
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}