"use client";

import { useTranslations, useFormatter } from "next-intl";
import { UserButton } from "@clerk/nextjs";
import { Badge } from "@/app/components/ui/badge";
import { Calendar } from "lucide-react";

interface DashboardHeaderProps {
    user: {
        firstName: string | null;
        lastName: string | null;
        imageUrl: string;
        createdAt: number;
    }
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
    const t = useTranslations('Dashboard');
    const format = useFormatter();
    const memberSince = format.dateTime(new Date(user.createdAt), {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
    });

    return (
        <div className="relative overflow-hidden rounded-3xl bg-card border border-border/50 shadow-xl p-8 mb-8">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <div className="w-64 h-64 bg-primary rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <div className="flex-shrink-0 relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/50 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative h-32 w-32 rounded-full overflow-hidden border-4 border-background shadow-2xl">
                        <img src={user.imageUrl} alt="Profile" className="object-cover w-full h-full" />
                    </div>
                    <div className="absolute bottom-1 right-1">
                        <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: "h-10 w-10 border-2 border-background" } }} />
                    </div>
                </div>

                <div className="text-center md:text-left space-y-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60">
                            {t('welcome')} {user.firstName || "Sellers"}!
                        </h1>
                        <p className="text-muted-foreground text-lg mt-1 font-medium">
                            {t('description')}
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-center md:justify-start gap-4">
                        <Badge variant="secondary" className="px-4 py-1.5 text-sm font-semibold flex items-center gap-2 rounded-full bg-primary/5 border-primary/10 text-primary">
                            <Calendar className="h-4 w-4" />
                            {t('account.memberSince')} {memberSince}
                        </Badge>
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-bold text-xs px-3 py-1 rounded-full">
                            {t('account.badge')}
                        </Badge>
                    </div>
                </div>
            </div>
        </div>
    );
}
