"use client";

import { useState, useEffect, useRef } from "react";
import { useActionState } from "react";
import { submitContent, deleteReview } from "@/app/actions/review";
import { usePathname } from "next/navigation";
import { StarRating } from "./star-rating";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { MessageSquarePlus, Loader2, Pencil, Trash2, X, CornerDownRight, Reply } from "lucide-react";
import { useLocalizedToast } from "@/hooks/use-localized-toast";
import { useFormatter, useTranslations } from "next-intl";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/app/components/ui/dialog";

interface ReviewsSectionProps {
    productId: string;
    reviews: any[];
    canReview: boolean;
    currentUserId: string | null;
    isSeller?: boolean;
}

export function ReviewsSection({ productId, reviews, canReview, currentUserId, isSeller }: ReviewsSectionProps) {
    const { showSuccess, showError } = useLocalizedToast();
    const pathname = usePathname();
    const format = useFormatter();
    const t = useTranslations('Reviews');
    const commonT = useTranslations('Common');

    // State for main review form
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [editingReviewId, setEditingReviewId] = useState<string | null>(null);

    // State for reply form
    const [replyingToId, setReplyingToId] = useState<string | null>(null);
    const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
    const [replyComment, setReplyComment] = useState("");

    // State for delete confirmation
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);

    const [state, action, isPending] = useActionState(submitContent, null);
    const [deleteState, deleteAction, isDeleting] = useActionState(deleteReview, null);

    const lastStateRef = useRef<any>(null);
    const lastDeleteStateRef = useRef<any>(null);

    // Separate reviews and replies
    const topLevelReviews = reviews.filter(r => !r.parentId && r.type === 'review');
    const replies = reviews.filter(r => r.type === 'reply');

    const getRepliesForReview = (reviewId: string) => {
        return replies.filter(r => r.parentId === reviewId);
    };

    useEffect(() => {
        if (!state || state === lastStateRef.current) return;
        lastStateRef.current = state;

        if (state.success) {
            showSuccess(state.message);
            // Reset forms
            if (editingReviewId) setEditingReviewId(null);
            if (replyingToId) setReplyingToId(null);
            setEditingReplyId(null);
            setComment("");
            setReplyComment("");
            setRating(5);
        } else if (state.error) {
            showError(state.error);
        }
    }, [state, showSuccess, showError, editingReviewId, replyingToId, editingReplyId]);

    useEffect(() => {
        if (!deleteState || deleteState === lastDeleteStateRef.current) return;
        lastDeleteStateRef.current = deleteState;

        if (deleteState.success) {
            showSuccess(deleteState.message);
            setShowDeleteConfirm(false);
            setReviewToDelete(null);
        } else if (deleteState.error) {
            showError(deleteState.error);
        }
    }, [deleteState, showSuccess, showError]);

    const handleEdit = (review: any) => {
        setEditingReviewId(review._id);
        setRating(review.rating);
        setComment(review.comment);
        // Cancel other actions
        setReplyingToId(null);
        setEditingReplyId(null);
    };

    const handleReply = (reviewId: string) => {
        setReplyingToId(reviewId);
        setReplyComment("");
        setEditingReplyId(null);
        // Cancel other actions
        setEditingReviewId(null);
    };

    const handleReplyEdit = (reply: any) => {
        setReplyingToId(reply.parentId);
        setEditingReplyId(reply._id);
        setReplyComment(reply.comment);
        // Cancel other actions
        setEditingReviewId(null);
    };

    const cancelActions = () => {
        setEditingReviewId(null);
        setReplyingToId(null);
        setEditingReplyId(null);
        setRating(5);
        setComment("");
        setReplyComment("");
    };

    const confirmDelete = (reviewId: string) => {
        setReviewToDelete(reviewId);
        setShowDeleteConfirm(true);
    };

    // Helper to render user info
    const renderUserInfo = (review: any) => (
        <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
                <AvatarFallback>{review.userName ? review.userName[0].toUpperCase() : "U"}</AvatarFallback>
            </Avatar>
            <span className="font-semibold text-sm">
                {review.userName || t('user')}
                {review.type === 'reply' && <span className="ml-2 text-xs text-primary font-normal bg-primary/10 px-1.5 py-0.5 rounded capitalize">{t('verifiedSeller')}</span>}
            </span>
            {review.userId === currentUserId && (
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">{t('me')}</span>
            )}
        </div>
    );

    const displayForm = canReview || editingReviewId;

    return (
        <div className="space-y-8 mt-12">
            <h3 className="text-2xl font-bold flex items-center gap-2">
                {t('title')} ({topLevelReviews.length})
            </h3>

            {/* FORMULAIRE PRINCIPAL */}
            {displayForm && (
                <div className="bg-muted/30 p-6 rounded-xl border">
                    <h4 className="font-semibold mb-4 flex items-center gap-2 justify-between">
                        <div className="flex items-center gap-2">
                            <MessageSquarePlus className="w-4 h-4" />
                            {editingReviewId ? t('editReview') : t('leaveReview')}
                        </div>
                        {editingReviewId && (
                            <Button variant="ghost" size="sm" onClick={cancelActions} className="h-8 px-2">
                                <X className="w-4 h-4 mr-1" /> {t('cancel')}
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
                            <label className="text-sm font-medium">{t('yourRating')}</label>
                            <StarRating rating={rating} interactive onRatingChange={setRating} size={24} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('yourComment')}</label>
                            <Textarea
                                name="comment"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder={t('placeholder')}
                                className="bg-background"
                                required
                            />
                        </div>

                        <Button disabled={isPending}>
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t('sending')}
                                </>
                            ) : (
                                editingReviewId ? t('update') : t('publish')
                            )}
                        </Button>
                    </form>
                </div>
            )}

            {!topLevelReviews.length && !displayForm && (
                <div className="text-muted-foreground text-sm italic">
                    {t('noReviews')}
                </div>
            )}

            {/* LISTE DES AVIS */}
            <div className="grid gap-6">
                {topLevelReviews.map((review) => {
                    const reviewReplies = getRepliesForReview(review._id);
                    const isReplying = replyingToId === review._id;

                    return (
                        <div key={review._id} className="border-b pb-6 last:border-0">
                            {/* AVIS PARENT */}
                            <div className="flex items-center justify-between mb-2">
                                {renderUserInfo(review)}
                                <div className="flex items-center gap-4">
                                    <span className="text-xs text-muted-foreground">
                                        {format.dateTime(new Date(review.createdAt), { year: 'numeric', month: 'numeric', day: 'numeric' })}
                                    </span>

                                    <div className="flex items-center gap-1">
                                        {/* Actions: Edit/Delete if owner */}
                                        {review.userId === currentUserId && (
                                            <>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => handleEdit(review)}>
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => confirmDelete(review._id)}>
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </>
                                        )}
                                        {/* Reply button for Seller */}
                                        {isSeller && !reviewReplies.length && (
                                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground hover:text-primary" onClick={() => handleReply(review._id)}>
                                                <Reply className="w-3 h-3 mr-1" /> {t('reply')}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <StarRating rating={review.rating} size={14} className="mb-2" />

                            {review.comment && (
                                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                                    {review.comment}
                                </p>
                            )}

                            {/* REPONSES */}
                            {reviewReplies.length > 0 && (
                                <div className="ml-6 mt-4 pl-4 border-l-2 border-primary/20 space-y-4">
                                    {reviewReplies.map((reply: any) => (
                                        <div key={reply._id} className="bg-muted/20 p-3 rounded-lg">
                                            <div className="flex items-center justify-between mb-1">
                                                {renderUserInfo(reply)}
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-muted-foreground">
                                                        {format.dateTime(new Date(reply.createdAt), { year: 'numeric', month: 'numeric', day: 'numeric' })}
                                                    </span>
                                                    {reply.userId === currentUserId && (
                                                        <>
                                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={() => handleReplyEdit(reply)}>
                                                                <Pencil className="h-3 w-3" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => confirmDelete(reply._id)}>
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-sm text-foreground">{reply.comment}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* FORMULAIRE DE REPONSE */}
                            {isReplying && (
                                <div className="ml-6 mt-4 pl-4 border-l-2 border-primary/20 animate-in slide-in-from-top-2 fade-in">
                                    <div className="bg-muted/30 p-4 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-semibold flex items-center gap-2">
                                                <CornerDownRight className="w-4 h-4 text-muted-foreground" />
                                                {editingReplyId ? t('editReview') : t('reply')}
                                            </span>
                                            <Button variant="ghost" size="sm" onClick={cancelActions} className="h-6 px-2 text-xs">
                                                <X className="w-3 h-3 mr-1" /> {commonT('cancel')}
                                            </Button>
                                        </div>
                                        <form action={action}>
                                            <input type="hidden" name="productId" value={productId} />
                                            <input type="hidden" name="path" value={pathname} />
                                            <input type="hidden" name="type" value="reply" />
                                            <input type="hidden" name="parentId" value={review._id} />
                                            {editingReplyId && <input type="hidden" name="reviewId" value={editingReplyId} />}

                                            <Textarea
                                                name="comment"
                                                value={replyComment}
                                                onChange={(e) => setReplyComment(e.target.value)}
                                                placeholder={t('replyPlaceholder')}
                                                className="bg-background min-h-[80px] mb-2"
                                                required
                                            />
                                            <div className="flex justify-end">
                                                <Button size="sm" disabled={isPending}>
                                                    {isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Reply className="w-3 h-3 mr-1" />}
                                                    {editingReplyId ? t('update') : t('sendReply')}
                                                </Button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* DELETE CONFIRMATION DIALOG */}
            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('confirmDelete')}</DialogTitle>
                        <DialogDescription>
                            {/* You can add a more specific description here if needed */}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                            {commonT('cancel') || 'Cancel'}
                        </Button>
                        <form action={deleteAction}>
                            <input type="hidden" name="reviewId" value={reviewToDelete || ''} />
                            <input type="hidden" name="path" value={pathname} />
                            <Button variant="destructive" type="submit">
                                {commonT('confirm') || 'Delete'}
                            </Button>
                        </form>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}