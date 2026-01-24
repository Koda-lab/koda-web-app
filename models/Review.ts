import mongoose, { Schema, Document, model, models } from 'mongoose';

export interface IReview extends Document {
    productId: mongoose.Types.ObjectId;
    userId: string; // Clerk ID de l'acheteur
    userName: string; // Pour afficher sans refaire de requête
    rating: number; // 1 à 5
    comment?: string;
    createdAt: Date;
}

const ReviewSchema = new Schema<IReview>(
    {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        userId: { type: String, required: true },
        userName: { type: String, required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, maxlength: 500 },
    },
    { timestamps: true }
);

// Un utilisateur ne peut laisser qu'un seul avis par produit
ReviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

const Review = models.Review || model<IReview>('Review', ReviewSchema);
export default Review;