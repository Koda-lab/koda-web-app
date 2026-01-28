"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

// Components
import { DashboardHeader } from "@/app/components/dashboard/DashboardHeader";
import { StatsGrid } from "@/app/components/dashboard/StatsGrid";
import { ActivityFeed } from "@/app/components/dashboard/ActivityFeed";
import { ProductList } from "@/app/components/dashboard/ProductList";
import { FavoritesList } from "@/app/components/dashboard/FavoritesList";
import DashboardInbox from "@/app/components/dashboard/DashboardInbox";
import DashboardModeSwitcher, { DashboardMode } from "@/app/components/dashboard/DashboardModeSwitcher";

interface DashboardContentProps {
    user: any;
    balance: any;
    sales: any[];
    products: any[];
    orders: any[];
    favorites: any[];
    onDelete: (productId: string) => Promise<void>;
    initialMode?: DashboardMode;
}

export function DashboardContent({ user, balance, sales, products, orders, favorites, onDelete, initialMode = "buyer" }: DashboardContentProps) {
    const [mode, setMode] = useState<DashboardMode>(initialMode);
    const t = useTranslations('Dashboard');

    // Sync mode when initialMode changes (e.g. navigation from Link)
    useEffect(() => {
        if (initialMode) {
            setMode(initialMode);
        }
    }, [initialMode]);

    return (
        <div className="min-h-screen bg-background/50">
            <div className="container mx-auto py-12 pt-32 px-4 max-w-7xl space-y-8">
                {/* Header Section */}
                <DashboardHeader user={user} />

                {/* Mode Switcher */}
                <DashboardModeSwitcher currentMode={mode} onChangeMode={setMode} />

                <div className="space-y-12 transition-all duration-500">
                    {mode === "seller" ? (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Seller View */}
                            <StatsGrid balance={balance} />

                            <ActivityFeed sales={sales} orders={[]} />

                            <ProductList
                                products={products}
                                onDelete={onDelete}
                            />
                        </div>
                    ) : mode === "messages" ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Inbox View */}
                            <DashboardInbox />
                        </div>
                    ) : (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Buyer View */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2">
                                    <ActivityFeed sales={[]} orders={orders} />
                                </div>
                                <div>
                                    <FavoritesList favorites={favorites} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
