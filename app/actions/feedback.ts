"use server";

import { z } from "zod";
import { resend } from "@/lib/resend"; // On importe notre client

const feedbackSchema = z.object({
    type: z.enum(["bug", "contact", "feature"]),
    email: z.string().email({ message: "Email invalide" }),
    subject: z.string().min(5, { message: "Le sujet est trop court" }),
    message: z.string().min(10, { message: "Votre message est un peu court..." }),
});

export type FeedbackState = {
    success?: boolean;
    errors?: {
        [K in keyof z.infer<typeof feedbackSchema>]?: string[];
    };
    message?: string;
};

export async function sendFeedbackAction(prevState: FeedbackState, formData: FormData): Promise<FeedbackState> {
    // Validation des données
    const validatedFields = feedbackSchema.safeParse({
        type: formData.get("type"),
        email: formData.get("email"),
        subject: formData.get("subject"),
        message: formData.get("message"),
    });

    if (!validatedFields.success) {
        return {
            success: false,
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Veuillez vérifier les champs du formulaire.",
        };
    }

    const { type, email, subject, message } = validatedFields.data;

    try {
        // ENVOI DE L'EMAIL VIA RESEND
        await resend.emails.send({
            from: 'Koda Feedback <onboarding@resend.dev>', // Utilise ce mail par défaut tant que tu n'as pas configuré ton domaine
            to: 'hello.kodateam@gmail.com',
            replyTo: email, // Pour pouvoir répondre directement à l'utilisateur
            subject: `[${type.toUpperCase()}] ${subject}`,
            html: `
        <h1>Nouveau message de Koda</h1>
        <p><strong>Type :</strong> ${type}</p>
        <p><strong>De :</strong> ${email}</p>
        <hr />
        <h3>Message :</h3>
        <p style="white-space: pre-wrap;">${message}</p>
      `
        });

        return {
            success: true,
            message: "Merci ! Votre message a bien été reçu.",
        };

    } catch (error) {
        console.error("Erreur d'envoi Resend:", error);
        return {
            success: false,
            message: "Une erreur est survenue lors de l'envoi. Réessayez plus tard.",
        };
    }
}