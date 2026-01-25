"use server";

import { connectToDatabase } from "@/lib/db";
import { Product } from "@/models/Product";
import User from "@/models/User";

export interface ProductFilterParams {
    platforms?: string[];
    categories?: string[];
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
    query?: string;
    page?: number;
    limit?: number;
}

import { getOrSetCache } from "@/lib/cache-utils";

/**
 * Récupère les produits avec filtres dynamiques (SOLID: Open/Closed Principle)
 */
export async function getFilteredProducts(params: ProductFilterParams) {
    try {
        const page = params.page || 1;
        const limit = params.limit || 12; // 12 produits par défaut
        const skip = (page - 1) * limit;

        // Create a unique cache key based on params
        const cacheKey = `products_v3:${JSON.stringify(params)}`;

        return await getOrSetCache(cacheKey, async () => {
            await connectToDatabase();

            const filters: any = {};

            // Recherche textuelle
            if (params.query) {
                filters.title = { $regex: params.query, $options: "i" };
            }

            // Filtre par plateforme (spécifique aux Automations)
            if (params.platforms && params.platforms.length > 0) {
                filters.platform = { $in: params.platforms };
            }

            // Filtre par catégorie
            if (params.categories && params.categories.length > 0) {
                filters.category = { $in: params.categories };
            }

            // Filtre par prix
            if (params.minPrice !== undefined || params.maxPrice !== undefined) {
                filters.price = {};
                if (params.minPrice !== undefined) filters.price.$gte = params.minPrice;
                if (params.maxPrice !== undefined) filters.price.$lte = params.maxPrice;
            }

            // Gestion du tri
            let sortOption: any = { createdAt: -1 };
            if (params.sort === "price_asc") sortOption = { price: 1 };
            if (params.sort === "price_desc") sortOption = { price: -1 };
            if (params.sort === "newest") sortOption = { createdAt: -1 };

            // 1. Compter le total sans pagination pour le calcul des pages
            const totalCount = await Product.countDocuments(filters);

            // 2. Exécution de la requête avec pagination
            const products = await Product.find(filters)
                .sort(sortOption)
                .skip(skip)
                .limit(limit)
                .lean();

            // Récupération optimisée des vendeurs (Batch fetching)
            const sellerIds = [...new Set(products.map((p: any) => p.sellerId))];
            const sellers = await User.find({ clerkId: { $in: sellerIds } }).lean();
            const sellerMap = new Map(sellers.map((s: any) => [s.clerkId, s]));

            const formattedProducts = products.map((p: any) => ({
                ...p,
                _id: p._id.toString(),
                createdAt: p.createdAt ? p.createdAt.toISOString() : null,
                updatedAt: p.updatedAt ? p.updatedAt.toISOString() : null,
                seller: sellerMap.get(p.sellerId) ? {
                    username: (sellerMap.get(p.sellerId) as any).username ||
                        `${(sellerMap.get(p.sellerId) as any).firstName || ''} ${(sellerMap.get(p.sellerId) as any).lastName || ''}`.trim() ||
                        "Vendeur",
                    firstName: (sellerMap.get(p.sellerId) as any).firstName,
                    lastName: (sellerMap.get(p.sellerId) as any).lastName,
                    imageUrl: (sellerMap.get(p.sellerId) as any).imageUrl
                } : null
            }));

            return {
                products: formattedProducts,
                metadata: {
                    totalCount,
                    totalPages: Math.ceil(totalCount / limit),
                    currentPage: page,
                    limit
                }
            };
        }, 300); // Cache for 5 minutes

    } catch (error) {
        console.error("Error fetching filtered products:", error);
        return { products: [], metadata: { totalCount: 0, totalPages: 0, currentPage: 1, limit: 12 } };
    }
}