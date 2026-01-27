"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Search, X } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/app/components/ui/select";
import { Badge } from "@/app/components/ui/badge";
import { useTranslations } from 'next-intl';

interface SearchBarProps {

}

export function SearchBar({ }: SearchBarProps) {
    const t = useTranslations('Search');
    const tCats = useTranslations('Categories');
    const router = useRouter();
    const searchParams = useSearchParams();

    const [query, setQuery] = useState(searchParams.get("q") || "");
    const [platform, setPlatform] = useState(searchParams.get("platform") || "all");
    const [category, setCategory] = useState(searchParams.get("category") || "all");

    const [mounted, setMounted] = useState(false);

    const PLATFORMS = [
        { value: "all", label: t('allPlatforms') },
        { value: "n8n", label: "n8n" },
        { value: "Make", label: "Make" },
        { value: "Zapier", label: "Zapier" },
        { value: "Python", label: "Python" },
        { value: "Other", label: t('other') },
    ];

    const CATEGORIES = [
        { value: "all", label: t('allCategories') },
        { value: "Social Media", label: tCats('socialMedia') },
        { value: "Email Marketing", label: tCats('emailMarketing') },
        { value: "Productivity", label: tCats('productivity') },
        { value: "Sales", label: tCats('sales') },
        { value: "Other", label: tCats('other') },
    ];

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const applyFilters = () => {
        const params = new URLSearchParams();

        if (query.trim()) params.set("q", query);
        if (platform !== "all") params.set("platform", platform);
        if (category !== "all") params.set("category", category);


        const queryString = params.toString();
        router.push(queryString ? `/?${queryString}` : "/");
    };

    const clearFilters = () => {
        setQuery("");
        setPlatform("all");
        setCategory("all");

        router.push("/");
    };

    const hasActiveFilters = query || platform !== "all" || category !== "all";

    // Appliquer les filtres quand ils changent
    useEffect(() => {
        if (mounted) {
            applyFilters();
        }
    }, [platform, category]); // Retirer mounted des dépendances pour éviter double trigger

    // Hydration fix: Ne pas rendre les Select (Radix UI) tant que pas monté
    if (!mounted) {
        return (
            <div className="w-full max-w-4xl space-y-4">
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1 h-10 bg-muted/20 animate-pulse rounded-md"></div>
                    <div className="w-full md:w-[200px] h-10 bg-muted/20 animate-pulse rounded-md"></div>
                    <div className="w-full md:w-[200px] h-10 bg-muted/20 animate-pulse rounded-md"></div>
                    <div className="w-auto h-10 bg-muted/20 animate-pulse rounded-md px-8"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl space-y-4">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder={t('placeholder')}
                        className="pl-10 bg-background/50 border-muted-foreground/20"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>

                {/* Platform Filter */}
                <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger className="w-full md:w-[200px]">
                        <SelectValue placeholder={t('platform')} />
                    </SelectTrigger>
                    <SelectContent>
                        {PLATFORMS.map((p) => (
                            <SelectItem key={p.value} value={p.value}>
                                {p.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Category Filter */}
                <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-full md:w-[200px]">
                        <SelectValue placeholder={t('category')} />
                    </SelectTrigger>
                    <SelectContent>
                        {CATEGORIES.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                                {c.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>



                <Button type="submit" className="md:w-auto">
                    <Search className="h-4 w-4 mr-2" />
                    {t('search')}
                </Button>
            </form>

            {/* Active Filters Display */}
            {hasActiveFilters && (
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-muted-foreground">{t('activeFilters')}</span>
                    {query && (
                        <Badge variant="secondary" className="gap-1">
                            {t('search')}: {query}
                            <X className="h-3 w-3 cursor-pointer" onClick={() => setQuery("")} />
                        </Badge>
                    )}
                    {platform !== "all" && (
                        <Badge variant="secondary" className="gap-1">
                            {PLATFORMS.find((p) => p.value === platform)?.label}
                            <X className="h-3 w-3 cursor-pointer" onClick={() => setPlatform("all")} />
                        </Badge>
                    )}
                    {category !== "all" && (
                        <Badge variant="secondary" className="gap-1">
                            {CATEGORIES.find((c) => c.value === category)?.label}
                            <X className="h-3 w-3 cursor-pointer" onClick={() => setCategory("all")} />
                        </Badge>
                    )}

                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 text-xs">
                        {t('clearAll')}
                    </Button>
                </div>
            )}
        </div>
    );
}