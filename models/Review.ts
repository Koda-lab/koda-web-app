import mongoose, { Schema, Document, model, models } from 'mongoose';

export interface IReview extends Document {
    productId: mongoose.Types.ObjectId;
    userId: string;
    userName: string;
    type: 'review' | 'comment' | 'question';
    rating?: number;
    comment: string;
    parentId?: mongoose.Types.ObjectId;
    createdAt: Date;
}

const ReviewSchema = new Schema<IReview>(
    {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        userId: { type: String, required: true },
        userName: { type: String, required: true },

        type: {
            type: String,
            enum: ['review', 'comment', 'question', 'reply'],
            default: 'review',
            required: true
        },

        parentId: { type: Schema.Types.ObjectId, ref: 'Review' },

        rating: { type: Number, min: 1, max: 5 },

        comment: { type: String, maxlength: 1000, required: true },
    },
    { timestamps: true }
);

// Index pour optimiser la récupération des reviews par produit
ReviewSchema.index({ productId: 1, type: 1 });


ReviewSchema.index(
    { productId: 1, userId: 1, type: 1 },
    {
        unique: true,
        partialFilterExpression: { type: 'review' }
    }
);

const Review = models.Review || model<IReview>('Review', ReviewSchema);
export default Review;