"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/app/components/ui/select";
import { useTranslations } from "next-intl";

interface SortSelectProps {
    initialSort: string;
}

export function SortSelect({ initialSort }: SortSelectProps) {
    const t = useTranslations('Catalog.sort');
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleSortChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("sort", value);
        router.push(`/catalog?${params.toString()}`);
    };

    return (
        <Select value={initialSort} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('placeholder')} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="newest">{t('newest')}</SelectItem>
                <SelectItem value="price_asc">{t('priceAsc')}</SelectItem>
                <SelectItem value="price_desc">{t('priceDesc')}</SelectItem>
            </SelectContent>
        </Select>
    );
}
