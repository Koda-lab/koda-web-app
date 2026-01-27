"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/hooks/use-favorites";
import { toggleFavorite } from "@/app/actions/favorites";
import { useAuth } from "@clerk/nextjs";
import { useLocalizedToast } from "@/hooks/use-localized-toast";
import { useTranslations } from "next-intl";

interface FavoriteButtonProps {
    productId: string;
    size?: "sm" | "md" | "lg";
    variant?: "icon" | "button";
    className?: string;
    disabled?: boolean; // Hide button if true (e.g., already purchased)
}

export function FavoriteButton({
    productId,
    size = "md",
    variant = "icon",
    className,
    disabled = false
}: FavoriteButtonProps) {
    const { userId } = useAuth();
    const { showSuccess, showInfo } = useLocalizedToast();
    const t = useTranslations('Favorites');
    const favorites = useFavorites();
    const [isPending, startTransition] = useTransition();
    const [isAnimating, setIsAnimating] = useState(false);

    const isFavorited = favorites.isFavorited(productId);

    // Don't render if disabled (e.g., already purchased or own product)
    if (disabled) return null;

    const sizeClasses = {
        sm: "h-7 w-7",
        md: "h-9 w-9",
        lg: "h-11 w-11",
    };

    const iconSizes = {
        sm: 14,
        md: 18,
        lg: 22,
    };

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!userId) {
            showInfo("loginRequired");
            return;
        }

        // Optimistic update
        favorites.toggleFavorite(productId);
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 300);

        // Sync with server
        startTransition(async () => {
            try {
                const result = await toggleFavorite(productId);
                if (result.action === "added") {
                    showSuccess("addedToFavorites");
                } else {
                    showSuccess("removedFromFavorites");
                }
            } catch (error) {
                // Revert on error
                favorites.toggleFavorite(productId);
                console.error("Failed to toggle favorite:", error);
            }
        });
    };

    if (variant === "button") {
        return (
            <Button
                variant={isFavorited ? "default" : "outline"}
                size="sm"
                onClick={handleClick}
                disabled={isPending}
                className={cn(
                    "gap-2 transition-all",
                    isFavorited && "bg-red-500 hover:bg-red-600 text-white border-red-500",
                    className
                )}
            >
                <Heart
                    size={iconSizes[size]}
                    className={cn(
                        "transition-all",
                        isFavorited && "fill-current",
                        isAnimating && "scale-125"
                    )}
                />
                {isFavorited ? t('saved') : t('save')}
            </Button>
        );
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={handleClick}
            disabled={isPending}
            className={cn(
                sizeClasses[size],
                "rounded-full transition-all hover:scale-110",
                isFavorited
                    ? "text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    : "text-muted-foreground hover:text-red-500 hover:bg-red-500/10",
                className
            )}
        >
            <Heart
                size={iconSizes[size]}
                className={cn(
                    "transition-all duration-200",
                    isFavorited && "fill-current",
                    isAnimating && "scale-125"
                )}
            />
            <span className="sr-only">
                {isFavorited ? t('removeFromFavorites') : t('addToFavorites')}
            </span>
        </Button>
    );
}
