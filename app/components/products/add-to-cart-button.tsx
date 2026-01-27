"use client";

import { ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { useLocalizedToast } from "@/hooks/use-localized-toast";
import { useTranslations } from "next-intl";

interface AddToCartButtonProps {
    product: {
        _id: string;
        title: string;
        price: number;
        category: string;
        platform: string;
        previewImageUrl?: string;
        sellerId: string;
    };
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
    const t = useTranslations('ProductCard');
    const cart = useCart();
    const { showSuccess } = useLocalizedToast();

    const isInCart = cart.items.some(item => item._id === product._id);

    const handleClick = () => {
        if (isInCart) {
            cart.removeItem(product._id);
            showSuccess('articleRemoved');
        } else {
            cart.addItem(product as any);
            showSuccess('addedToCart');
        }
    };

    return (
        <Button
            variant={isInCart ? "destructive" : "outline"}
            className={isInCart ? "w-full text-lg h-14" : "w-full text-lg h-14 border-primary/30 hover:bg-primary/10"}
            size="lg"
            onClick={handleClick}
        >
            {isInCart ? (
                <>
                    <Trash2 className="mr-2 h-5 w-5" />
                    {t('removeFromCart')}
                </>
            ) : (
                <>
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    {t('addToCart')}
                </>
            )}
        </Button>
    );
}
