"use server";

import { requireUser } from "@/lib/auth-utils";
import { connectToDatabase } from "@/lib/db";
import Automation from "@/models/Automation";
import User from "@/models/User";
import { revalidatePath } from "next/cache";
import { ensureSellerIsReady } from "@/lib/stripe-utils";
import { CreateAutomationInput } from "@/types/automation";
import { ProductSchema } from "@/lib/validations";
import { ratelimit } from "@/lib/ratelimit";

export async function createAutomation(formData: CreateAutomationInput) {
    const user = await requireUser();

    // RATE LIMITING
    const { success } = await ratelimit.limit(`create_automation_${user.clerkId}`);
    if (!success) {
        throw new Error("Too many requests. Please try again later.");
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
    ensureSellerIsReady(user);

    // Création du produit uniquement si le compte Stripe est prêt
    const newAutomation = await Automation.create({
        ...validData,
        sellerId: user.clerkId,
    });

    revalidatePath("/");
    return { success: true, id: newAutomation._id.toString() };
}