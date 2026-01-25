"use client";

import { useState, useEffect } from "react";
import { useActionState } from "react";
import { submitContent, deleteReview } from "@/app/actions/review";
import { usePathname } from "next/navigation";
import { StarRating } from "./star-rating";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { toast } from "sonner";
import { MessageSquarePlus, Loader2, Pencil, Trash2, X } from "lucide-react";
import { useLocalizedToast } from "@/hooks/use-localized-toast";
import { useFormatter } from "next-intl";

interface ReviewsSectionProps {
    productId: string;
    reviews: any[];
    canReview: boolean;
    currentUserId: string | null;
}

export function ReviewsSection({ productId, reviews, canReview, currentUserId }: ReviewsSectionProps) {
    const { showSuccess, showError } = useLocalizedToast();
    const pathname = usePathname();
    const format = useFormatter();
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [editingReviewId, setEditingReviewId] = useState<string | null>(null);

    const [state, action, isPending] = useActionState(submitContent, null);
    const [deleteState, deleteAction, isDeleting] = useActionState(deleteReview, null);

    // Filter to find if the user already has a review
    const userReview = currentUserId ? reviews.find(r => r.userId === currentUserId && r.type === 'review') : null;

    useEffect(() => {
        if (state?.success) {
            showSuccess(state.message);
            setEditingReviewId(null);
            if (!editingReviewId) {
                setComment("");
                setRating(5);
            }
        } else if (state?.error) {
            showError(state.error);
        }
    }, [state, showSuccess, showError, editingReviewId]);

    useEffect(() => {
        if (deleteState?.success) {
            showSuccess(deleteState.message);
        } else if (deleteState?.error) {
            showError(deleteState.error);
        }
    }, [deleteState, showSuccess, showError]);

    const handleEdit = (review: any) => {
        setEditingReviewId(review._id);
        setRating(review.rating);
        setComment(review.comment);
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingReviewId(null);
        setRating(5);
        setComment("");
    };

    const displayForm = canReview || editingReviewId;

    return (
        <div className="space-y-8 mt-12">
            <h3 className="text-2xl font-bold flex items-center gap-2">
                Avis clients ({reviews.filter(r => r.type === 'review').length})
            </h3>

            {/* FORMULAIRE (Visible si achat ou si en train d'éditer) */}
            {displayForm ? (
                <div className="bg-muted/30 p-6 rounded-xl border">
                    <h4 className="font-semibold mb-4 flex items-center gap-2 justify-between">
                        <div className="flex items-center gap-2">
                            <MessageSquarePlus className="w-4 h-4" />
                            {editingReviewId ? "Modifier mon avis" : "Laisser un avis"}
                        </div>
                        {editingReviewId && (
                            <Button variant="ghost" size="sm" onClick={cancelEdit} className="h-8 px-2">
                                <X className="w-4 h-4 mr-1" /> Annuler
                            </Button>
                        )}
                    </h4>
                    <form action={action} className="space-y-4">
                        <input type="hidden" name="productId" value={productId} />
                        <input type="hidden" name="path" value={pathname} />
                        <input type="hidden" name="type" value="review" />
                        <input type="hidden" name="rating" value={rating} />
                        {editingReviewId && <input type="hidden" name="reviewId" value={editingReviewId} />}

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Votre note</label>
                            <StarRating rating={rating} interactive onRatingChange={setRating} size={24} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Votre commentaire</label>
                            <Textarea
                                name="comment"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
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
                                editingReviewId ? "Mettre à jour" : "Publier l'avis"
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
                                {review.userId === currentUserId && (
                                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Moi</span>
                                )}
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-xs text-muted-foreground">
                                    {format.dateTime(new Date(review.createdAt), { year: 'numeric', month: 'numeric', day: 'numeric' })}
                                </span>
                                {review.userId === currentUserId && review.type === 'review' && (
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-muted-foreground hover:text-primary"
                                            onClick={() => handleEdit(review)}
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                        <form action={deleteAction}>
                                            <input type="hidden" name="reviewId" value={review._id} />
                                            <input type="hidden" name="path" value={pathname} />
                                            <Button
                                                type="submit"
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                onClick={(e) => {
                                                    if (!confirm("Supprimer cet avis ?")) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                                disabled={isDeleting}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </form>
                                    </div>
                                )}
                            </div>
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