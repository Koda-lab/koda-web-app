"use client";

import { useTranslations, useFormatter } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { ShoppingBag, ArrowUpRight, Clock, ShoppingCart } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Link } from "@/i18n/routing";
import { Badge } from "@/app/components/ui/badge";

interface ActivityFeedProps {
    sales?: any[];
    orders?: any[];
}

export function ActivityFeed({ sales = [], orders = [] }: ActivityFeedProps) {
    const t = useTranslations('Dashboard');
    const format = useFormatter();

    return (
        <div className="grid grid-cols-1 gap-8">
            {/* Purchases Part */}
            {orders !== undefined && (
                <>
                    {orders.length > 0 ? (
                        <Card className="border-border/50 bg-card shadow-lg flex flex-col h-[500px]">
                            <CardHeader className="border-b border-border/50 pb-6 flex flex-row items-center justify-between bg-muted/10">
                                <div>
                                    <CardTitle className="text-xl font-bold flex items-center gap-2 tracking-tight">
                                        <ShoppingBag className="h-5 w-5 text-primary" />
                                        {t('sections.orders')}
                                    </CardTitle>
                                    <CardDescription>{t('orders.boughtOn')}</CardDescription>
                                </div>
                                <Badge variant="secondary" className="font-bold bg-primary/10 text-primary border-none">
                                    {orders.length}
                                </Badge>
                            </CardHeader>
                            <CardContent className="p-0 flex-1 overflow-y-auto custom-scrollbar">
                                <div className="divide-y divide-border/30">
                                    {orders.map((order) => (
                                        <div key={order._id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 bg-muted rounded-xl overflow-hidden border border-border/50 group-hover:scale-105 transition-transform duration-300 shadow-sm">
                                                    {order.productId && order.productId.previewImageUrl ? (
                                                        <img src={order.productId.previewImageUrl} alt={order.productId.title} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center p-3">
                                                            <ShoppingBag className="text-muted-foreground/30 h-full w-full" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                                                        {order.productId ? order.productId.title : "Product Unavailable"}
                                                    </p>
                                                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                                                        <Clock className="h-3 w-3" />
                                                        {format.dateTime(new Date(order.createdAt), { year: 'numeric', month: 'numeric', day: 'numeric' })} • <span className="font-bold text-foreground/70">{order.amount.toFixed(2)} €</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {order.productId && (
                                                <Button asChild variant="secondary" size="sm" className="h-8 px-3 text-[11px] font-bold uppercase tracking-wider rounded-full hover:bg-primary hover:text-primary-foreground transition-all">
                                                    <Link href={`/product/${order.productId._id}`}>
                                                        {t('orders.access')}
                                                    </Link>
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ) : sales.length === 0 && (
                        <div className="h-[400px] flex flex-col items-center justify-center p-8 text-center bg-muted/5 border-2 border-dashed border-border/50 rounded-3xl">
                            <div className="p-4 bg-muted rounded-full mb-4">
                                <ShoppingCart className="h-8 w-8 text-muted-foreground opacity-20" />
                            </div>
                            <h3 className="text-lg font-bold mb-2">{t('sections.orders')}</h3>
                            <p className="text-sm text-muted-foreground max-w-[200px] leading-relaxed mb-6">
                                {t('orders.noOrders')}
                            </p>
                            <Button asChild variant="outline" className="font-bold rounded-full px-8">
                                <Link href="/catalog">{t('orders.explore')}</Link>
                            </Button>
                        </div>
                    )}
                </>
            )}

            {/* Sales Part */}
            {sales !== undefined && sales.length > 0 && (
                <Card className="border-border/50 bg-card shadow-lg flex flex-col h-[500px]">
                    <CardHeader className="border-b border-border/50 pb-6 flex flex-row items-center justify-between bg-primary/[0.02]">
                        <div>
                            <CardTitle className="text-xl font-bold flex items-center gap-2 tracking-tight">
                                <ArrowUpRight className="h-5 w-5 text-green-500" />
                                {t('sections.sales')}
                            </CardTitle>
                            <CardDescription>{t('sales.description')}</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 overflow-y-auto custom-scrollbar">
                        <div className="divide-y divide-border/30">
                            {sales.map((sale) => (
                                <div key={sale._id} className="p-4 flex items-center justify-between hover:bg-green-500/[0.02] transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-green-500/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform bg-green-500/5">
                                            <ArrowUpRight className="h-5 w-5 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-foreground line-clamp-1">{sale.productId.title}</p>
                                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                                                <Clock className="h-3 w-3" />
                                                {format.dateTime(new Date(sale.createdAt), { year: 'numeric', month: 'numeric', day: 'numeric' })}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className="font-black text-green-600 text-lg">
                                            +{sale.amount.toFixed(2)} €
                                        </div>
                                        <Badge variant="outline" className="text-[9px] uppercase font-bold border-green-500/20 text-green-600 bg-green-500/5">Success</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {sales !== undefined && sales.length === 0 && orders.length === 0 && (
                <div className="h-[400px] flex flex-col items-center justify-center p-8 text-center bg-muted/5 border-2 border-dashed border-border/50 rounded-3xl">
                    <div className="p-4 bg-muted rounded-full mb-4 opacity-50">
                        <ArrowUpRight className="h-8 w-8 text-muted-foreground opacity-20" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{t('sections.sales')}</h3>
                    <p className="text-sm text-muted-foreground max-w-[200px] leading-relaxed">
                        {t('sales.noSales')}
                    </p>
                </div>
            )}
        </div>
    );
}
