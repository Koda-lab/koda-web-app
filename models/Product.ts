import mongoose, { Schema, model, models } from 'mongoose';
import { ProductCategory } from '@/types/product';

// Options pour permettre l'héritage (discriminators)
const baseOptions = {
    discriminatorKey: 'productType', // C'est ce champ qui dira si c'est une 'automation' ou autre
    collection: 'products',
    timestamps: true
};

const ProductSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    category: {
        type: String,
        required: true,
        enum: Object.values(ProductCategory)
    },
    tags: [{ type: String }],
    sellerId: { type: String, required: true },
    previewImageUrl: { type: String },
}, baseOptions);

export const Product = models.Product || model('Product', ProductSchema);