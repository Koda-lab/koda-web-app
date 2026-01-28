"use client";

import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import { getUnreadMessageCount } from "@/app/actions/messaging";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export default function UnreadMessagesBadge() {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const fetchCount = async () => {
            try {
                const unread = await getUnreadMessageCount();
                setCount(unread);
            } catch (error) {
                // Silent error
            }
        };

        fetchCount();
        // Poll every 10 seconds
        const interval = setInterval(fetchCount, 10000);

        return () => clearInterval(interval);
    }, []);

    return (
        <Link
            href="/dashboard?mode=messages"
            className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
            title="Messages"
        >
            <MessageSquare className="w-5 h-5" />

            {count > 0 && (
                <span className={cn(
                    "absolute top-0 right-0 flex items-center justify-center min-w-[18px] h-[18px] px-1",
                    "text-[10px] font-bold text-white bg-red-500 rounded-full ring-2 ring-background",
                    "animate-in zoom-in duration-300"
                )}>
                    {count > 9 ? '9+' : count}
                </span>
            )}
        </Link>
    );
}
