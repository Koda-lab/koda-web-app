import { Suspense } from "react";
import { getFilteredProducts } from "@/app/actions/products";
import { ProductCard } from "@/app/components/products/product-card";
import { FiltersSidebar } from "@/app/components/products/filters-sidebar";
import { SortSelect } from "@/app/components/products/sort-select";
import { SidebarSearch } from "@/app/components/products/sidebar-search";
import { Search, Loader2 } from "lucide-react";
import { IProduct } from "@/types/product"; // Utilisation de l'interface de base

interface CatalogPageProps {
    searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
    const params = searchParams ?? {};

    // Normalisation des paramètres pour l'action
    const filters = {
        platforms: typeof params.platforms === "string" ? [params.platforms] : (Array.isArray(params.platforms) ? params.platforms : []),
        categories: typeof params.categories === "string" ? [params.categories] : (Array.isArray(params.categories) ? params.categories : []),
        minPrice: params.minPrice ? Number(params.minPrice) : 0,
        maxPrice: params.maxPrice ? Number(params.maxPrice) : 2000,
        sort: typeof params.sort === "string" ? params.sort : "newest",
        query: typeof params.query === "string" ? params.query : "",
    };

    return (
        <div className="container mx-auto px-4 py-8 min-h-screen">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Sticky pour les filtres */}
                <aside className="w-full md:w-[280px] space-y-8 md:sticky md:top-24 h-fit">
                    <Suspense fallback={<div className="h-10 w-full bg-muted animate-pulse rounded" />}>
                        <SidebarSearch defaultValue={filters.query} />
                    </Suspense>
                    <Suspense fallback={<div className="h-[400px] w-full bg-muted animate-pulse rounded" />}>
                        <FiltersSidebar
                            initialPlatforms={filters.platforms}
                            initialCategories={filters.categories}
                            initialMinPrice={filters.minPrice}
                            initialMaxPrice={filters.maxPrice}
                        />
                    </Suspense>
                </aside>

                {/* Contenu Principal avec Suspense pour l'optimisation du rendu */}
                <main className="flex-1">
                    <div className="flex flex-col sm:row justify-between items-start sm:items-center mb-8 gap-4">
                        <h1 className="text-3xl font-bold italic text-primary">Marketplace</h1>
                        <Suspense fallback={<div className="w-[180px] h-10 bg-muted animate-pulse rounded" />}>
                            <SortSelect initialSort={filters.sort} />
                        </Suspense>
                    </div>

                    <Suspense key={JSON.stringify(params)} fallback={<LoadingGrid />}>
                        <ProductList filters={filters} />
                    </Suspense>
                </main>
            </div>
        </div>
    );
}

// Composant interne pour gérer l'affichage des produits
async function ProductList({ filters }: { filters: any }) {
    const products = await getFilteredProducts(filters);

    if (products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-2xl bg-muted/5">
                <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold">Aucun résultat</h3>
                <p className="text-muted-foreground mt-2">Ajustez vos filtres pour trouver ce que vous cherchez.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product: IProduct) => (
                <ProductCard key={product._id} product={product} />
            ))}
        </div>
    );
}

// Skeleton de chargement pour le streaming
function LoadingGrid() {
    return (
        <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Chargement des pépites...</span>
        </div>
    );
}