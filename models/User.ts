import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    clerkId: { type: String, required: true, unique: true },
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String, unique: true, sparse: true },
    imageUrl: { type: String },
    stripeConnectId: { type: String }, // L'ID du compte Stripe Connect
    onboardingComplete: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", UserSchema);


