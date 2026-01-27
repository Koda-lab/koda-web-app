"use client";

import { useTranslations } from "next-intl";
import { ShoppingBag, LayoutDashboard, Store } from "lucide-react";
import { cn } from "@/lib/utils";

export type DashboardMode = "buyer" | "seller";

interface DashboardModeSwitcherProps {
    mode: DashboardMode;
    onChange: (mode: DashboardMode) => void;
}

export function DashboardModeSwitcher({ mode, onChange }: DashboardModeSwitcherProps) {
    const t = useTranslations('Dashboard.modes');

    return (
        <div className="flex justify-center mb-8">
            <div className="inline-flex p-1.5 bg-muted/50 backdrop-blur-xl border border-border/50 rounded-2xl shadow-inner gap-1">
                <button
                    onClick={() => onChange("buyer")}
                    className={cn(
                        "flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 cursor-pointer",
                        mode === "buyer"
                            ? "bg-background text-primary shadow-xl ring-1 ring-border/20 scale-100"
                            : "text-muted-foreground hover:text-foreground hover:bg-white/5 scale-95 opacity-70"
                    )}
                >
                    <ShoppingBag className={cn("h-4 w-4", mode === "buyer" ? "text-primary" : "text-muted-foreground")} />
                    {t('buyer')}
                </button>
                <button
                    onClick={() => onChange("seller")}
                    className={cn(
                        "flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 cursor-pointer",
                        mode === "seller"
                            ? "bg-background text-primary shadow-xl ring-1 ring-border/20 scale-100"
                            : "text-muted-foreground hover:text-foreground hover:bg-white/5 scale-95 opacity-70"
                    )}
                >
                    <Store className={cn("h-4 w-4", mode === "seller" ? "text-primary" : "text-muted-foreground")} />
                    {t('seller')}
                </button>
            </div>
        </div>
    );
}
