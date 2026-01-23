"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/app/components/ui/input";
import { Search, Loader2 } from "lucide-react";

type SidebarSearchProps = {
    defaultValue?: string;
};

export function SidebarSearch({ defaultValue }: SidebarSearchProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    // Initialize from prop (server-derived) or fallback to URL
    const initialQuery = defaultValue ?? searchParams.get("query") ?? "";
    const [value, setValue] = useState(initialQuery);

    const [debouncedValue, setDebouncedValue] = useState(value);

    // recherche asynchrone
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, 200); // 200ms de delaie de reponse pour la recherche

        return () => {
            clearTimeout(handler);
        };
    }, [value]);

    useEffect(() => {
        if (debouncedValue !== initialQuery) {
            startTransition(() => {
                const params = new URLSearchParams(searchParams.toString());
                if (debouncedValue) {
                    params.set("query", debouncedValue);
                } else {
                    params.delete("query");
                }
                router.push(`/catalog?${params.toString()}`);
            });
        }
    }, [debouncedValue, router, searchParams, initialQuery]);

    return (
        <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Rechercher..."
                className="pl-8"
                value={value}
                onChange={(e) => setValue(e.target.value)}
            />
            {isPending && (
                <div className="absolute right-2.5 top-2.5">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
            )}
        </div>
    );
}
