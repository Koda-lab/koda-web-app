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
    cart: mongoose.Types.ObjectId[];
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
    cart: [{ type: Schema.Types.ObjectId, ref: "Automation" }],
}, { timestamps: true });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export default User;