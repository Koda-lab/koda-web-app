"use server";

import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/db";
import Automation from "@/models/Automation";
import { revalidatePath } from "next/cache";
import { CreateAutomationInput } from "@/types/automation";

export async function createAutomation(formData: CreateAutomationInput) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error("Vous devez être connecté pour vendre un produit.");
    }

    await connectToDatabase();

    const newAutomation = await Automation.create({
        ...formData,
        sellerId: userId,
    });

    revalidatePath("/"); // Actualise la page d'accueil pour voir le nouveau produit
    return { success: true, id: newAutomation._id.toString() };
}