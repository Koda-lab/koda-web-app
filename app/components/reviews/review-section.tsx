"use client";

import { useState } from "react";
import { useActionState } from "react";
import { submitReview } from "@/app/actions/review";
import { StarRating } from "./star-rating";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { toast } from "sonner";
import { MessageSquarePlus } from "lucide-react";

interface ReviewsSectionProps {
    productId: string;
    reviews: any[]; // On passera les reviews depuis la page serveur
    canReview: boolean; // Si l'user a acheté le produit
}

export function ReviewsSection({ productId, reviews, canReview }: ReviewsSectionProps) {
    const [rating, setRating] = useState(5);
    const [state, action, isPending] = useActionState(submitReview, null);

    if (state?.success) {
        toast.success(state.message);
    } else if (state?.error) {
        toast.error(state.error);
    }

    return (
        <div className="space-y-8 mt-12">
            <h3 className="text-2xl font-bold flex items-center gap-2">
                Avis clients ({reviews.length})
            </h3>

            {/* FORMULAIRE (Visible seulement si achat) */}
            {canReview ? (
                <div className="bg-muted/30 p-6 rounded-xl border">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <MessageSquarePlus className="w-4 h-4" />
                        Laisser un avis
                    </h4>
                    <form action={action} className="space-y-4">
                        <input type="hidden" name="productId" value={productId} />
                        <input type="hidden" name="rating" value={rating} />

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Votre note</label>
                            <StarRating rating={rating} interactive onRatingChange={setRating} size={24} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Votre commentaire</label>
                            <Textarea
                                name="comment"
                                placeholder="Qu'avez-vous pensé de cette automatisation ?"
                                className="bg-background"
                            />
                        </div>

                        <Button disabled={isPending}>
                            {isPending ? "Envoi..." : "Publier l'avis"}
                        </Button>
                    </form>
                </div>
            ) : (
                !reviews.length && (
                    <div className="text-muted-foreground text-sm italic">
                        Aucun avis pour le moment. Soyez le premier à tester !
                    </div>
                )
            )}

            {/* LISTE DES AVIS */}
            <div className="grid gap-6">
                {reviews.map((review) => (
                    <div key={review._id} className="border-b pb-6 last:border-0">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Avatar className="w-8 h-8">
                                    <AvatarFallback>{review.userName[0]}</AvatarFallback>
                                </Avatar>
                                <span className="font-semibold text-sm">{review.userName}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                                {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                        </div>

                        <StarRating rating={review.rating} size={14} className="mb-2" />

                        {review.comment && (
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {review.comment}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}