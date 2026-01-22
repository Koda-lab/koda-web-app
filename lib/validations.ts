import { z } from "zod";

// Schéma pour la création/mise à jour d'un produit
export const ProductSchema = z.object({
    title: z
        .string()
        .min(3, "Le titre doit contenir au moins 3 caractères.")
        .max(100, "Le titre ne peut pas dépasser 100 caractères."),

    description: z
        .string()
        .min(20, "La description doit être détaillée (min 20 caractères).")
        .max(2000, "Description trop longue (max 2000 caractères)."),

    price: z
        .number()
        .min(1, "Le prix minimum est de 1€.")
        .max(1000, "Le prix maximum est de 1000€."),

    category: z.enum(["n8n", "Make", "Zapier", "Autre"]),

    fileUrl: z.string().url("L'URL du fichier est invalide."),

    previewImageUrl: z
        .string()
        .url("L'URL de l'image est invalide.")
        .optional()
        .or(z.literal("")),
});

// Type inféré à partir du schéma
export type ProductInput = z.infer<typeof ProductSchema>;

// Schéma d'update (partiel possible, mais pour l'instant on garde les mêmes règles)
export const UpdateProductSchema = ProductSchema.pick({
    title: true,
    description: true,
    price: true,
    previewImageUrl: true
}).partial({
    previewImageUrl: true
});
