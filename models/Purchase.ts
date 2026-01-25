import mongoose, { Schema, model, models } from 'mongoose';

const PurchaseSchema = new Schema({
    productId: { type: Schema.Types.ObjectId, ref: 'Automation', required: true },
    buyerId: { type: String, required: true }, // ID Clerk de l'acheteur
    sellerId: { type: String, required: true }, // ID Clerk du vendeur
    amount: { type: Number, required: true }, // Brut
    netAmount: { type: Number, required: true }, // Net vendeur (85%)
    platformFee: { type: Number, required: true }, // Commission Koda (15%)
    category: { type: String }, // Dénormalisé pour analytics
    platform: { type: String }, // Dénormalisé pour analytics
    stripeSessionId: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now },
});

// Index pour vérifier les achats d'un utilisateur
PurchaseSchema.index({ buyerId: 1 });


// Index pour l'analytics (historique des ventes)
PurchaseSchema.index({ sellerId: 1, createdAt: -1 });
PurchaseSchema.index({ createdAt: 1 });

const Purchase = models.Purchase || model('Purchase', PurchaseSchema);
export default Purchase;