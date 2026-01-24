"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
    rating: number;
    max?: number;
    size?: number;
    interactive?: boolean; // Si true, on peut cliquer
    onRatingChange?: (rating: number) => void;
    className?: string;
}

export function StarRating({
    rating,
    max = 5,
    size = 16,
    interactive = false,
    onRatingChange,
    className
}: StarRatingProps) {

    return (
        <div className={cn("flex items-center gap-1", className)}>
            {Array.from({ length: max }).map((_, i) => {
                const starValue = i + 1;
                const isFull = starValue <= Math.round(rating);

                return (
                    <button
                        key={i}
                        type={interactive ? "button" : undefined}
                        disabled={!interactive}
                        onClick={() => interactive && onRatingChange?.(starValue)}
                        className={cn(
                            "transition-colors",
                            interactive ? "cursor-pointer hover:scale-110" : "cursor-default"
                        )}
                    >
                        <Star
                            size={size}
                            className={cn(
                                isFull ? "fill-primary text-primary" : "fill-muted text-muted-foreground/30",
                                interactive && "hover:fill-primary hover:text-primary transition-all"
                            )}
                        />
                    </button>
                );
            })}
        </div>
    );
}