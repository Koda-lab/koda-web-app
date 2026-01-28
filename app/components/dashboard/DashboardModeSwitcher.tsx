"use client";

import { useTranslations } from "next-intl";
import { LayoutDashboard, ShoppingBag, User, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { getUnreadMessageCount } from "@/app/actions/messaging";
import { cn } from "@/lib/utils";

export type DashboardMode = 'buyer' | 'seller' | 'messages';

interface DashboardModeSwitcherProps {
    currentMode: DashboardMode;
    onChangeMode: (mode: DashboardMode) => void;
}

export default function DashboardModeSwitcher({ currentMode, onChangeMode }: DashboardModeSwitcherProps) {
    const t = useTranslations('Dashboard.modes');
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchCount = async () => {
            try {
                const count = await getUnreadMessageCount();
                setUnreadCount(count);
            } catch (error) {
                // silent
            }
        };

        fetchCount();
        const interval = setInterval(fetchCount, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex space-x-1 bg-muted p-1 rounded-lg mb-6 overflow-x-auto">
            <button
                onClick={() => onChangeMode('buyer')}
                className={`flex items-center px-4 py-2 rounded-md transition-all whitespace-nowrap cursor-pointer ${currentMode === 'buyer'
                    ? 'bg-background shadow-sm text-foreground font-medium'
                    : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
                    }`}
            >
                <ShoppingBag className="w-4 h-4 mr-2" />
                {t('buyer')}
            </button>
            <button
                onClick={() => onChangeMode('seller')}
                className={`flex items-center px-4 py-2 rounded-md transition-all whitespace-nowrap cursor-pointer ${currentMode === 'seller'
                    ? 'bg-background shadow-sm text-foreground font-medium'
                    : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
                    }`}
            >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                {t('seller')}
            </button>
            <button
                onClick={() => onChangeMode('messages')}
                className={`flex items-center px-4 py-2 rounded-md transition-all whitespace-nowrap cursor-pointer relative ${currentMode === 'messages'
                    ? 'bg-background shadow-sm text-foreground font-medium'
                    : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
                    }`}
            >
                <MessageSquare className="w-4 h-4 mr-2" />
                Messages
                {unreadCount > 0 && (
                    <span className={cn(
                        "ml-2 flex items-center justify-center min-w-[18px] h-[18px] px-1",
                        "text-[10px] font-bold text-white bg-red-500 rounded-full",
                        "animate-in zoom-in duration-300"
                    )}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>
        </div>
    );
}
