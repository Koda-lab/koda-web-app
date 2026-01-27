import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
    clerkId: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    imageUrl?: string;
    stripeConnectId?: string;
    onboardingComplete: boolean;
    role: 'user' | 'admin';
    isBanned: boolean; // Field for soft ban
    cart: mongoose.Types.ObjectId[];
    favorites: mongoose.Types.ObjectId[]; // Wishlist
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new mongoose.Schema({
    clerkId: { type: String, required: true, unique: true },
    username: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String, unique: true, sparse: true },
    imageUrl: { type: String },
    stripeConnectId: { type: String },
    onboardingComplete: { type: Boolean, default: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isBanned: { type: Boolean, default: false }, // Default to not banned
    cart: [{ type: Schema.Types.ObjectId, ref: "Automation" }],
    favorites: [{ type: Schema.Types.ObjectId, ref: "Automation" }], // Wishlist
}, { timestamps: true });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export default User;