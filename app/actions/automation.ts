"use server";

import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/db";
import Automation from "@/models/Automation";
import User from "@/models/User";
import { revalidatePath } from "next/cache";
import { CreateAutomationInput } from "@/types/automation";
import { ProductSchema } from "@/lib/validations";

export async function createAutomation(formData: CreateAutomationInput) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error("Vous devez être connecté pour vendre un produit.");
    }

    // Validation Zod
    const validationResult = ProductSchema.safeParse(formData);

    if (!validationResult.success) {
        // On renvoie la première erreur trouvée pour simplifier l'affichage
        throw new Error(validationResult.error.issues[0].message);
    }

    const validData = validationResult.data;

    await connectToDatabase();

    // VÉRIFICATION STRIPE CONNECT
    const userDoc = await User.findOne({ clerkId: userId });

    if (!userDoc || !userDoc.stripeConnectId || !userDoc.onboardingComplete) {
        throw new Error("Veuillez configurer votre compte de paiement dans le Dashboard avant de vendre.");
    }

    // Création du produit uniquement si le compte Stripe est prêt
    const newAutomation = await Automation.create({
        ...validData,
        sellerId: userId,
    });

    revalidatePath("/");
    return { success: true, id: newAutomation._id.toString() };
}