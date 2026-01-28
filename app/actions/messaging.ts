"use server";

import { connectToDatabase } from "@/lib/db";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import User from "@/models/User";
import { requireAuth } from "@/lib/auth-utils";
import { resend } from "@/lib/resend";
import { auth } from "@clerk/nextjs/server";
import { createNotification } from "@/app/actions/notifications";

// --- Types ---
export interface IMessage {
    _id: string;
    senderId: string;
    content: string;
    createdAt: string;
    read: boolean;
    isMine: boolean;
}

export interface IConversation {
    _id: string;
    otherUser: {
        id: string;
        username: string;
        imageUrl: string;
    };
    lastMessage: string;
    lastMessageAt: string;
    hasUnread: boolean;
}

/**
 * Démarre une conversation ou récupère l'existante
 */
export async function startConversation(recipientId: string, initialMessage?: string) {
    const userId = await requireAuth();

    if (userId === recipientId) {
        throw new Error("You cannot message yourself");
    }

    await connectToDatabase();

    // Chercher si conversation existe déjà
    // participants doit contenir userId ET recipientId
    let conversation = await Conversation.findOne({
        participants: { $all: [userId, recipientId] }
    });

    if (!conversation) {
        conversation = await Conversation.create({
            participants: [userId, recipientId],
            lastMessage: initialMessage || "Démarrage de la conversation",
            lastMessageAt: new Date(),
        });
    }

    // Si un message initial est fourni, on l'envoie
    if (initialMessage) {
        await sendMessage(conversation._id.toString(), initialMessage);
    }

    return conversation._id.toString();
}

/**
 * Envoie un message dans une conversation
 */
export async function sendMessage(conversationId: string, content: string) {
    const userId = await requireAuth();
    if (!content.trim()) return;

    await connectToDatabase();

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) throw new Error("Conversation not found");

    // Vérifier que l'utilisateur fait partie de la conv
    if (!conversation.participants.includes(userId)) {
        throw new Error("Unauthorized");
    }

    // Créer le message
    const message = await Message.create({
        conversationId,
        senderId: userId,
        content: content.trim(),
        read: false
    });

    // Mettre à jour la conversation
    conversation.lastMessage = content.substring(0, 50) + (content.length > 50 ? "..." : "");
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // --- Notification Email (Async) & In-App Notification ---
    // Trouver le destinataire
    const recipientId = conversation.participants.find((p: string) => p !== userId);
    if (recipientId) {
        // Create In-App Notification
        await createNotification(
            recipientId,
            'MESSAGE',
            'Nouveau message',
            `Vous avez reçu un message : "${content.substring(0, 30)}${content.length > 30 ? '...' : ''}"`,
            `/dashboard?mode=messages&c=${conversationId}`,
            'Notifications.messageReceivedTitle',
            'Notifications.messageReceivedBody',
            {
                preview: content.substring(0, 30) + (content.length > 30 ? '...' : '')
            }
        );

        try {
            const recipient = await User.findOne({ clerkId: recipientId });
            if (recipient && recipient.email) {
                await resend.emails.send({
                    from: 'Koda Messaging <notifications@resend.dev>', // Ou ton domaine vérifié
                    to: recipient.email,
                    subject: 'Vous avez reçu un nouveau message sur Koda',
                    html: `
                        <h2>Nouveau message</h2>
                        <p>Vous avez reçu un message d'un utilisateur sur Koda.</p>
                        <p>Connectez-vous à votre tableau de bord pour répondre :</p>
                        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard?mode=messages&c=${conversationId}" style="background:#000;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;">
                            Voir le message
                        </a>
                    `
                });
            }
        } catch (error) {
            console.error("Erreur envoi email notification:", error);
        }
    }

    return { success: true, messageId: message._id.toString() };
}

/**
 * Récupère toutes les conversations de l'utilisateur connecté
 */
export async function getMyConversations(): Promise<IConversation[]> {
    const { userId } = await auth();
    if (!userId) return [];

    await connectToDatabase();

    const conversations = await Conversation.find({ participants: userId })
        .sort({ lastMessageAt: -1 })
        .lean();

    // Pour chaque conv, il faut trouver l'autre utilisateur et savoir s'il y a des non-lus
    const results = await Promise.all(conversations.map(async (conv: any) => {
        const otherUserId = conv.participants.find((p: string) => p !== userId);

        let otherUser = { id: otherUserId, username: "Utilisateur inconnu", imageUrl: "" };

        // On essaie de choper les infos user (DB locale ou Clerk)
        const userDoc = await User.findOne({ clerkId: otherUserId }).select('username firstName lastName imageUrl');
        if (userDoc) {
            otherUser.username = userDoc.username || userDoc.firstName || "Utilisateur";
            otherUser.imageUrl = userDoc.imageUrl || "";
        }

        // Check unread count: messages dans cette conv, pas de moi, pas lus
        const unreadCount = await Message.countDocuments({
            conversationId: conv._id,
            senderId: { $ne: userId },
            read: false
        });

        return {
            _id: conv._id.toString(),
            otherUser,
            lastMessage: conv.lastMessage,
            lastMessageAt: conv.lastMessageAt.toISOString(),
            hasUnread: unreadCount > 0
        };
    }));

    return results;
}

/**
 * Récupère les messages d'une conversation
 */
export async function getConversationMessages(conversationId: string): Promise<IMessage[]> {
    const userId = await requireAuth();
    await connectToDatabase();

    const messages = await Message.find({ conversationId })
        .sort({ createdAt: 1 }) // Chronologique
        .lean();

    // Marquer comme lus ceux qui ne sont pas de moi
    await Message.updateMany(
        { conversationId, senderId: { $ne: userId }, read: false },
        { $set: { read: true } }
    );

    return messages.map((m: any) => ({
        _id: m._id.toString(),
        senderId: m.senderId,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
        read: m.read,
        isMine: m.senderId === userId
    }));
}

/**
 * Compte le nombre total de messages non lus pour l'utilisateur
 * Returns 0 if not authenticated (poll-safe)
 */
export async function getUnreadMessageCount(): Promise<number> {
    const { userId } = await auth(); // Soft check, no redirect
    if (!userId) return 0;

    await connectToDatabase();

    const count = await Message.countDocuments({
        senderId: { $ne: userId }, // Pas mes messages
        read: false,               // Non lus
        // Il faudrait idéalement vérifier que je suis dans la conversation
        // Mais comme on ne stocke pas les participants dans le message, on suppose que
        // si un message existe pour une conversation dont je suis membre, c'est bon.
        // Pour être rigoureux :
        conversationId: { $in: await Conversation.find({ participants: userId }).distinct('_id') }
    });

    return count;
}
