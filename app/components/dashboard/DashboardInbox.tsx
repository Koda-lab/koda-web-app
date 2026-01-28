"use client";

import { useEffect, useState, useRef, useTransition } from "react";
import { useAuth } from "@clerk/nextjs";
import { getMyConversations, getConversationMessages, sendMessage, startConversation } from "@/app/actions/messaging";
import { Loader2, Send, Search, MessageSquare, AlertCircle } from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { useLocalizedToast } from "@/hooks/use-localized-toast";
import { formatDistanceToNow } from "date-fns";
import { fr, enUS, es, de } from "date-fns/locale";
import { Link } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";

interface Conversation {
    _id: string;
    otherUser: {
        id: string;
        username: string;
        imageUrl: string;
    };
    lastMessage: string;
    lastMessageAt: string;
    hasUnread: boolean;
}

interface Message {
    _id: string;
    senderId: string;
    content: string;
    createdAt: string;
    read: boolean;
    isMine: boolean;
}

export default function DashboardInbox() {
    const t = useTranslations('Dashboard.Inbox');
    const { userId } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoadingConvs, setIsLoadingConvs] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isSending, startTransition] = useTransition();
    const scrollRef = useRef<HTMLDivElement>(null);
    const { showSuccess, showError } = useLocalizedToast();
    const locale = useLocale();

    const dateLocale = locale === 'fr' ? fr : locale === 'es' ? es : locale === 'de' ? de : enUS;

    // Load conversations & poll every 10s
    useEffect(() => {
        loadConversations();
        const interval = setInterval(() => {
            loadConversations(true); // silent
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    const loadConversations = async (silent = false) => {
        if (!silent) setIsLoadingConvs(true);
        try {
            const data = await getMyConversations();
            setConversations(data);
        } catch (error) {
            // Only log errors if not silent (user initiated) or if it's not a generic fetch error
            if (!silent) console.error("Failed to load conversations:", error);
        } finally {
            if (!silent) setIsLoadingConvs(false);
        }
    };

    // Load messages when conversation selected & poll every 5s
    useEffect(() => {
        if (!selectedConvId) return;

        const fetchMessages = async (silent = false) => {
            if (!silent) setIsLoadingMessages(true);
            try {
                const data = await getConversationMessages(selectedConvId);
                setMessages(data);
                // Mark as read locally
                setConversations(prev => prev.map(c =>
                    c._id === selectedConvId ? { ...c, hasUnread: false } : c
                ));
            } catch (error) {
                if (!silent) console.error("Failed to load messages:", error);
            } finally {
                if (!silent) setIsLoadingMessages(false);
            }
        };

        fetchMessages();
        const interval = setInterval(() => {
            fetchMessages(true); // silent
        }, 5000);

        return () => clearInterval(interval);
    }, [selectedConvId]);

    // Auto-scroll to bottom only if user is already at bottom or new message is mine
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConvId) return;

        startTransition(async () => {
            try {
                // Optimistic update
                const tempId = Date.now().toString();
                const tempMsg: Message = {
                    _id: tempId,
                    senderId: userId || "",
                    content: newMessage,
                    createdAt: new Date().toISOString(),
                    read: false,
                    isMine: true
                };
                setMessages(prev => [...prev, tempMsg]);
                setNewMessage("");

                await sendMessage(selectedConvId, tempMsg.content);
                // Refresh conversations to update last message preview
                loadConversations();
            } catch (error) {
                showError("messageSendError");
            }
        });
    };

    const selectedConversation = conversations.find(c => c._id === selectedConvId);

    return (
        <div className="flex h-[600px] border rounded-xl overflow-hidden bg-background shadow-sm">
            {/* Sidebar List */}
            <div className={`w-full md:w-1/3 border-r flex flex-col ${selectedConvId ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b bg-muted/30">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-primary" />
                        {t('title')}
                    </h2>
                </div>

                <ScrollArea className="flex-1">
                    {isLoadingConvs ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
                    ) : conversations.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center">
                            <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
                            {t('noConversations')}
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {conversations.map(conv => (
                                <button
                                    key={conv._id}
                                    onClick={() => setSelectedConvId(conv._id)}
                                    className={`p-4 flex gap-3 items-start hover:bg-muted/50 transition-colors text-left border-b border-border/50 ${selectedConvId === conv._id ? 'bg-muted border-l-4 border-l-primary' : ''}`}
                                >
                                    <Avatar className="w-10 h-10 border border-input/50">
                                        <AvatarImage src={conv.otherUser.imageUrl} />
                                        <AvatarFallback>{conv.otherUser.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <span className={`font-medium truncate ${conv.hasUnread ? 'text-foreground' : 'text-muted-foreground'}`}>{conv.otherUser.username}</span>
                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                                                {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true, locale: dateLocale })}
                                            </span>
                                        </div>
                                        <p className={`text-sm truncate ${conv.hasUnread ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                                            {conv.lastMessage}
                                        </p>
                                    </div>
                                    {conv.hasUnread && <div className="w-2.5 h-2.5 bg-primary rounded-full mt-2" />}
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className={`w-full md:w-2/3 flex flex-col ${!selectedConvId ? 'hidden md:flex' : 'flex'}`}>
                {selectedConvId ? (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b flex items-center gap-3 bg-muted/10">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="md:hidden -ml-2"
                                onClick={() => setSelectedConvId(null)}
                            >
                                ←
                            </Button>
                            <Avatar className="w-8 h-8">
                                <AvatarImage src={selectedConversation?.otherUser.imageUrl} />
                                <AvatarFallback>{selectedConversation?.otherUser.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <Link href={`/seller/${selectedConversation?.otherUser.id}`} className="font-semibold hover:underline decoration-primary underline-offset-4">
                                {selectedConversation?.otherUser.username}
                            </Link>
                        </div>

                        {/* Messages */}
                        <div
                            ref={scrollRef}
                            className="flex-1 p-4 overflow-y-auto space-y-4 bg-muted/5"
                        >
                            {isLoadingMessages ? (
                                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
                            ) : messages.length === 0 ? (
                                <div className="text-center text-sm text-muted-foreground py-10">{t('startDiscussion')}</div>
                            ) : (
                                messages.map((msg) => (
                                    <div
                                        key={msg._id}
                                        className={`flex flex-col max-w-[80%] ${msg.isMine ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                                    >
                                        <div
                                            className={`px-4 py-2 rounded-2xl text-sm ${msg.isMine
                                                ? 'bg-primary text-primary-foreground rounded-br-none'
                                                : 'bg-secondary text-secondary-foreground rounded-bl-none'}`}
                                        >
                                            {msg.content}
                                        </div>
                                        <span className="text-[10px] text-muted-foreground mt-1 px-1">
                                            {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: dateLocale })}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSendMessage} className="p-4 border-t bg-background flex gap-2">
                            <Input
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder={t('placeholder')}
                                className="rounded-full bg-muted/50 border-transparent focus:bg-background focus:border-primary/50 transition-all"
                                disabled={isSending}
                            />
                            <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={!newMessage.trim() || isSending}>
                                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </Button>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
                        <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-lg font-medium">{t('selectConversation')}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
