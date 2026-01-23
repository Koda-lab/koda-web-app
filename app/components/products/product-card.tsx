"use client";

import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { ShoppingCart, Eye } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { IAutomation } from "@/types/automation";
import { IProduct } from "@/types/product";
import { PlatformIcon } from "@/app/components/icons/platform-icon";
import { toast } from "sonner";

type ProductLike = IProduct | IAutomation;

interface ProductCardProps {
    product: ProductLike;
    userId?: string | null;
}

function isAutomation(p: ProductLike): p is IAutomation {
    return "platform" in p && "fileUrl" in p;
}

export function ProductCard({ product, userId }: ProductCardProps) {
    const cart = useCart();
    const isOwner = userId === product.sellerId;
    const automation = isAutomation(product);

    const onAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (!automation) {
            toast.error("Ce produit ne peut pas être ajouté au panier.");
            return;
        }

        cart.addItem(product);
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
                            Aperçu rapide
                        </Link>
                    </Button>
                </div>

                {/* Badge Category (Top Left) */}
                <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="backdrop-blur-md bg-background/80 hover:bg-background/90 shadow-sm">
                        {product.category}
                    </Badge>
                </div>
            </div>

            <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-center mb-2">
                    {/* Platform (only for automations) */}
                    {automation ? (
                        <div className="flex items-center gap-2">
                            <PlatformIcon platform={product.platform} className="w-5 h-5 text-muted-foreground" />
                            <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                                {product.platform}
                            </span>
                        </div>
                    ) : (
                        <div />
                    )}

                    <span className="font-bold text-lg text-primary">{product.price} €</span>
                </div>

                <h3 className="font-bold text-lg leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                    {product.title}
                </h3>

                {/* Seller Info */}
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <span>Proposé par</span>
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
                    className="w-full bg-primary/90 hover:bg-primary shadow-sm transition-all"
                    disabled={isOwner || !automation}
                >
                    {isOwner ? (
                        <>
                            <ShoppingCart className="mr-2 h-4 w-4 opacity-50" />
                            Votre produit
                        </>
                    ) : !automation ? (
                        <>
                            <ShoppingCart className="mr-2 h-4 w-4 opacity-50" />
                            Indisponible
                        </>
                    ) : (
                        <>
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Ajouter au panier
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}