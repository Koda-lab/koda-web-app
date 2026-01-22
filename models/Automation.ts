import mongoose, { Schema, model, models } from 'mongoose';

const AutomationSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, enum: ['n8n', 'Make', 'Zapier', 'Autre'], required: true },
    fileUrl: { type: String, required: true }, // URL vers AWS S3
    previewImageUrl: { type: String },
    sellerId: { type: String, required: true }, // ID Clerk de l'utilisateur
    createdAt: { type: Date, default: Date.now },
});

const Automation = models.Automation || model('Automation', AutomationSchema);
export default Automation;
