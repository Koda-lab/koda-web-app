"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/app/components/ui/button";

const CATEGORIES = [
    "Tous",
    "n8n",
    "Make",
    "Zapier",
    "AI"
];

export function CategoryFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const activeCategory = searchParams.get("category") || "Tous";

    const handleSelect = (category: string) => {
        const params = new URLSearchParams(searchParams.toString());

        if (category === "Tous" || category === activeCategory) {
            params.delete("category"); // Si on clique sur "Tous" ou l'actif, on retire le filtre
        } else {
            params.set("category", category); // Sinon on l'ajoute
        }

        // On met à jour l'URL
        router.push(`/?${params.toString()}`);
    };

    return (
        <div className="flex gap-2 overflow-x-auto pb-2 w-full justify-center scrollbar-hide">
            {CATEGORIES.map((cat) => (
                <Button
                    key={cat}
                    variant={activeCategory === cat ? "default" : "outline"}
                    onClick={() => handleSelect(cat)}
                    className={cn(
                        "rounded-full text-sm font-medium transition-all",
                        activeCategory === cat
                            ? "bg-primary hover:bg-primary/90 shadow-md"
                            : "bg-background hover:bg-muted text-muted-foreground hover:text-foreground border-transparent hover:border-border"
                    )}
                    size="sm"
                >
                    {cat}
                </Button>
            ))}
        </div>
    );
}