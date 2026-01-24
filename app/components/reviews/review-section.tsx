"use client";

import { useState, useEffect } from "react";
import { useActionState } from "react";
import { submitContent } from "@/app/actions/review";
import { usePathname } from "next/navigation";
import { StarRating } from "./star-rating";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { toast } from "sonner";
import { MessageSquarePlus, Loader2 } from "lucide-react";

interface ReviewsSectionProps {
    productId: string;
    reviews: any[];
    canReview: boolean;
}

export function ReviewsSection({ productId, reviews, canReview }: ReviewsSectionProps) {
    const pathname = usePathname();
    const [rating, setRating] = useState(5);

    // On utilise submitContent ici
    const [state, action, isPending] = useActionState(submitContent, null);

    // Effet pour gérer les notifications (Toasts)
    useEffect(() => {
        if (state?.success) {
            toast.success(state.message);
        } else if (state?.error) {
            toast.error(state.error);
        }
    }, [state]);

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

                        {/* 3. CHAMP CACHÉ POUR LE REFRESH */}
                        <input type="hidden" name="path" value={pathname} />

                        <input type="hidden" name="type" value="review" />
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
                                required
                            />
                        </div>

                        <Button disabled={isPending}>
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Envoi...
                                </>
                            ) : (
                                "Publier l'avis"
                            )}
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
                                    <AvatarFallback>{review.userName ? review.userName[0] : "U"}</AvatarFallback>
                                </Avatar>
                                <span className="font-semibold text-sm">{review.userName || "Utilisateur"}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                                {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                        </div>

                        {/* On affiche les étoiles seulement si c'est un avis noté */}
                        {review.type === 'review' && (
                            <StarRating rating={review.rating} size={14} className="mb-2" />
                        )}

                        {review.comment && (
                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {review.comment}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}