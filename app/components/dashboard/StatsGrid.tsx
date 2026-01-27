"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Wallet, TrendingUp, Info, ChevronRight } from "lucide-react";
import { StripeDashboardButton, StripeOnboardingButton } from "./StripeDashboardButtons";
import { Badge } from "@/app/components/ui/badge";

interface StatsGridProps {
    balance: {
        available: number;
        pending: number;
        currency: string;
    } | null;
}

export function StatsGrid({ balance }: StatsGridProps) {
    const t = useTranslations('Dashboard.stats');

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Wallet / Balance Card */}
            <Card className="relative overflow-hidden group border-primary/20 bg-gradient-to-br from-primary/[0.03] to-transparent shadow-lg flex flex-col justify-between">
                <div className="absolute top-0 right-0 -tr-1/4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Wallet className="w-32 h-32 text-primary" />
                </div>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-primary" />
                        {t('balance')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {balance ? (
                        <div className="space-y-4">
                            <div>
                                <div className="text-4xl font-black tracking-tight">{balance.available.toFixed(2)} {balance.currency}</div>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-none font-bold text-[10px] uppercase px-2">
                                        {t('available')}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground font-medium">
                                        {t('pending')}: {balance.pending.toFixed(2)} {balance.currency}
                                    </span>
                                </div>
                            </div>
                            <StripeDashboardButton className="shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all font-bold" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {t('stripeConfig')}
                            </p>
                            <StripeOnboardingButton className="font-bold shadow-lg shadow-primary/20" />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Commission Card */}
            <Card className="border-border/50 bg-card shadow-lg">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        {t('commission')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black tracking-tight text-foreground">15%</span>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold border-primary/20 text-primary">Standard</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed flex items-start gap-2 bg-muted/30 p-3 rounded-lg border border-border/50">
                        <Info className="h-4 w-4 mt-0.5 text-primary opacity-70" />
                        {t('commissionDesc')}
                    </p>
                    <button className="text-[11px] font-bold uppercase tracking-widest text-primary flex items-center gap-1 hover:gap-2 transition-all opacity-80 hover:opacity-100 cursor-pointer">
                        Learn about Premium <ChevronRight className="h-3 w-3" />
                    </button>
                </CardContent>
            </Card>

            {/* Analytics Summary / placeholder for next metric */}
            <Card className="border-border/50 bg-card shadow-lg border-dashed opacity-80 hover:opacity-100 transition-opacity">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        Conversion Rate
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-6 text-center">
                    <div className="p-3 bg-muted rounded-full mb-3">
                        <TrendingUp className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                    <p className="text-xs text-muted-foreground font-medium max-w-[150px]">
                        Available in the Professional plan
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
