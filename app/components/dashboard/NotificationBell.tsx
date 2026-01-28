"use client";

import { useEffect, useState } from "react";
import { Bell, Check, MessageSquare, ShoppingBag, Star, Package } from "lucide-react";
import { getNotifications, getUnreadNotificationCount, markAllNotificationsAsRead, markNotificationAsRead, INotificationData } from "@/app/actions/notifications";
import { Link, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { Button } from "@/app/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/app/components/ui/popover";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { enUS, fr, es, de } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<INotificationData[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const locale = useLocale();
    const router = useRouter();
    const t = useTranslations();

    const getDateLocale = () => {
        switch (locale) {
            case 'fr': return fr;
            case 'es': return es;
            case 'de': return de;
            default: return enUS;
        }
    };

    const fetchNotifications = async () => {
        try {
            const [data, count] = await Promise.all([
                getNotifications(10),
                getUnreadNotificationCount()
            ]);
            setNotifications(data);
            setUnreadCount(count);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    // Initial load & Polling
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10000);
        return () => clearInterval(interval);
    }, []);

    // Refresh when opening popover
    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    const handleMarkAllRead = async () => {
        setIsLoading(true);
        try {
            await markAllNotificationsAsRead();
            await fetchNotifications();
        } finally {
            setIsLoading(false);
        }
    };

    const handleNotificationClick = async (notification: INotificationData) => {
        if (!notification.read) {
            await markNotificationAsRead(notification._id);
            setUnreadCount(prev => Math.max(0, prev - 1));
            setNotifications(prev => prev.map(n => n._id === notification._id ? { ...n, read: true } : n));
        }
        setIsOpen(false);
        router.push(notification.link);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'MESSAGE': return <MessageSquare className="w-4 h-4 text-blue-500" />;
            case 'SALE': return <ShoppingBag className="w-4 h-4 text-green-500" />;
            case 'ORDER': return <Package className="w-4 h-4 text-orange-500" />;
            case 'REVIEW': return <Star className="w-4 h-4 text-yellow-500" />;
            default: return <Bell className="w-4 h-4 text-gray-500" />;
        }
    };

    // Helper to handle legacy keys in DB (notifications.x vs Notifications.x)
    const normalizeKey = (key: string) => {
        if (!key) return key;
        if (key.startsWith('notifications.')) {
            return 'Notifications.' + key.substring(14);
        }
        return key;
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5 text-muted-foreground" />
                    {unreadCount > 0 && (
                        <span className={cn(
                            "absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-[16px] px-0.5",
                            "text-[10px] font-bold text-white bg-red-500 rounded-full ring-2 ring-background",
                            "animate-in zoom-in duration-300"
                        )}>
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h4 className="font-semibold text-sm">{t('Notifications.center.title')}</h4>
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            disabled={isLoading}
                            className="text-xs text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                        >
                            {t('Notifications.center.markAllRead')}
                        </button>
                    )}
                </div>
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground p-4 text-center">
                            <Bell className="w-8 h-8 mb-2 opacity-20" />
                            <p className="text-sm">{t('Notifications.center.empty')}</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((notification) => (
                                <button
                                    key={notification._id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={cn(
                                        "flex items-start gap-3 p-4 text-left hover:bg-muted/50 transition-colors border-b last:border-0",
                                        !notification.read && "bg-muted/20"
                                    )}
                                >
                                    <div className={cn(
                                        "mt-1 p-2 rounded-full bg-background border shadow-sm",
                                        !notification.read && "border-primary/20"
                                    )}>
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <p className={cn("text-sm font-medium leading-none", !notification.read && "text-primary")}>
                                                {notification.titleKey ? t(normalizeKey(notification.titleKey), notification.params) : notification.title}
                                            </p>
                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: getDateLocale() })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {notification.messageKey ? t(normalizeKey(notification.messageKey), notification.params) : notification.message}
                                        </p>
                                    </div>
                                    {!notification.read && (
                                        <div className="w-2 h-2 mt-2 rounded-full bg-primary flex-shrink-0" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
