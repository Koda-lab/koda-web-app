"use client";

import { useState, useEffect } from "react";
// 1. On garde useSearchParams de next/navigation
import { useSearchParams } from "next/navigation";
// 2. IMPORTANT : On importe le router et pathname depuis VOTRE config i18n
import { useRouter, usePathname } from "@/i18n/routing";
import { Input } from "@/app/components/ui/input";
import { Search, X } from "lucide-react";

interface AdminSearchProps {
    type: 'users' | 'products';
}

export function AdminSearch({ type }: AdminSearchProps) {
    // 3. Ce router gère automatiquement les locales (fr/en/es)
    const router = useRouter();
    // 4. usePathname() nous donne le chemin actuel sans la locale (ex: "/admin")
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const paramKey = type === 'users' ? 'userQ' : 'productQ';
    const [query, setQuery] = useState(searchParams.get(paramKey) || "");

    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());

        if (query) {
            params.set(paramKey, query);
        } else {
            params.delete(paramKey);
        }

        const timeoutId = setTimeout(() => {
            // 5. On utilise pathname (dynamique) au lieu de hardcoder "/admin"
            // Le router.replace de next-intl ajoutera automatiquement /fr, /en, etc.
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query, paramKey, router, searchParams, pathname]);

    return (
        <div className="relative w-full max-w-sm mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder={type === 'users' ? "Rechercher (pseudo, email)..." : "Rechercher un produit..."}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 pr-10"
            />
            {query && (
                <button
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                    type="button"
                >
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
            )}
        </div>
    );
}