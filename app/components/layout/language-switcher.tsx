"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { Button } from "@/app/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { Languages } from "lucide-react";
import { useTransition } from "react";

export function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    const onSelectChange = (nextLocale: "fr" | "en" | "es" | "de") => {
        startTransition(() => {
            router.replace(pathname, { locale: nextLocale });
        });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={isPending}>
                    <Languages className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
                    <span className="sr-only">Toggle language</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onSelectChange("fr")} className={locale === "fr" ? "bg-accent" : ""}>
                    Français
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSelectChange("en")} className={locale === "en" ? "bg-accent" : ""}>
                    English
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSelectChange("es")} className={locale === "es" ? "bg-accent" : ""}>
                    Español
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSelectChange("de")} className={locale === "de" ? "bg-accent" : ""}>
                    Deutsch
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
