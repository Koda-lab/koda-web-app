import mongoose, { Schema, Document, model, models } from 'mongoose';

export interface IReview extends Document {
    productId: mongoose.Types.ObjectId;
    userId: string;
    userName: string;
    type: 'review' | 'comment' | 'question';
    rating?: number;
    comment: string;
    createdAt: Date;
}

const ReviewSchema = new Schema<IReview>(
    {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        userId: { type: String, required: true },
        userName: { type: String, required: true },

        type: {
            type: String,
            enum: ['review', 'comment', 'question'],
            default: 'review',
            required: true
        },

        rating: { type: Number, min: 1, max: 5 },

        comment: { type: String, maxlength: 1000, required: true },
    },
    { timestamps: true }
);

ReviewSchema.index(
    { productId: 1, userId: 1, type: 1 },
    {
        unique: true,
        partialFilterExpression: { type: 'review' }
    }
);

const Review = models.Review || model<IReview>('Review', ReviewSchema);
export default Review;