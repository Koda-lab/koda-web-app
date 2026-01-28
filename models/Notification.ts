import mongoose, { Schema, Document, Model } from "mongoose";

export interface INotification extends Document {
    userId: string; // The recipient's Clerk ID
    type: 'MESSAGE' | 'SALE' | 'ORDER' | 'REVIEW' | 'SYSTEM';
    title: string;
    message: string;
    titleKey?: string;
    messageKey?: string;
    params?: Record<string, string | number>;
    link: string;
    read: boolean;
    createdAt: Date;
}

const NotificationSchema: Schema = new Schema(
    {
        userId: { type: String, required: true, index: true },
        type: { type: String, required: true, enum: ['MESSAGE', 'SALE', 'ORDER', 'REVIEW', 'SYSTEM'] },
        title: { type: String, required: true },
        message: { type: String, required: true },
        titleKey: { type: String },
        messageKey: { type: String },
        params: { type: Map, of: Schema.Types.Mixed },
        link: { type: String, required: true },
        read: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Force recompilation to ensure new fields (titleKey) are registered
if (process.env.NODE_ENV === 'development') {
    delete mongoose.models.Notification;
}

const Notification: Model<INotification> = mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;
