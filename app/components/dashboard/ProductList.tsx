"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Link } from "@/i18n/routing";
import { Package, Plus, Edit, Trash2, Eye, Star, MessageSquare, BarChart3 } from "lucide-react";
import Image from "next/image";
import { getPublicImageUrl } from "@/lib/image-helper";
import { Badge } from "@/app/components/ui/badge";

interface ProductListProps {
    products: any[];
    onDelete: (productId: string) => Promise<void>;
}

export function ProductList({ products, onDelete }: ProductListProps) {
    const t = useTranslations('Dashboard');

    return (
        <section className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-gradient-to-r from-card/80 to-card/40 backdrop-blur-xl p-8 rounded-[2rem] border border-border/50 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
                <div className="relative z-10">
                    <h2 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
                        {t('sections.products')}
                    </h2>
                    <p className="text-muted-foreground font-medium mt-1">
                        Manage your expertise and track your performance
                    </p>
                </div>
                <Button asChild className="relative z-10 rounded-2xl h-14 px-8 font-bold text-lg shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all hover:scale-[1.02] active:scale-95">
                    <Link href="/sell">
                        <Plus className="mr-2 h-6 w-6 stroke-[3px]" />
                        {t('products.new')}
                    </Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
                {products.length > 0 ? (
                    products.map((product) => (
                        <Card key={product._id} className="group relative overflow-hidden flex flex-col h-full bg-card border-border/40 hover:border-primary/30 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-500 rounded-[1.5rem]">
                            {/* Image Container with Overlay */}
                            <div className="aspect-[16/10] bg-muted relative w-full overflow-hidden">
                                {product.previewImageUrl ? (
                                    <Image
                                        src={getPublicImageUrl(product.previewImageUrl)}
                                        alt={product.title}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center w-full h-full text-muted-foreground bg-secondary/30">
                                        <Package className="h-12 w-12 opacity-20 mb-3" />
                                        <span className="text-[10px] uppercase font-black opacity-40 tracking-widest">{t('products.noImage')}</span>
                                    </div>
                                )}

                                {/* Status & Quick Info Overlays */}
                                <div className="absolute top-4 left-4 flex gap-2">
                                    <Badge className="bg-background/80 backdrop-blur-md text-foreground border-border/50 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-lg">
                                        Active
                                    </Badge>
                                </div>

                                <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
                                    <div className="flex items-center gap-4 text-white text-xs font-bold">
                                        <div className="flex items-center gap-1.5">
                                            <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                                            {product.averageRating?.toFixed(1) || "5.0"}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <MessageSquare className="h-3.5 w-3.5 opacity-70" />
                                            {product.reviewCount || 0}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card Content */}
                            <div className="p-7 flex flex-col flex-1 space-y-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-start gap-4">
                                        <h3 className="font-extrabold text-xl line-clamp-2 leading-[1.2] group-hover:text-primary transition-colors flex-1" title={product.title}>
                                            {product.title}
                                        </h3>
                                        <div className="text-2xl font-black text-primary tabular-nums">
                                            {product.price.toFixed(2)}€
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground font-medium line-clamp-1 opacity-70">
                                        {product.category || "General"} • {product.tags?.length || 0} Tags
                                    </p>
                                </div>

                                {/* Actions Bar */}
                                <div className="mt-auto pt-6 border-t border-border/40 grid grid-cols-2 gap-3">
                                    <div className="col-span-2 flex gap-2">
                                        <Button variant="secondary" className="flex-1 rounded-xl font-bold text-xs h-11 bg-secondary/50 hover:bg-secondary/80 border-border/50" asChild>
                                            <Link href={`/product/${product._id}`}>
                                                <Eye className="mr-2 h-4 w-4 opacity-70" />
                                                Preview Listing
                                            </Link>
                                        </Button>
                                    </div>

                                    <Button variant="outline" className="rounded-xl font-bold text-xs h-11 border-border/50 hover:bg-muted/50 hover:border-primary/20 transition-all" asChild>
                                        <Link href={`/dashboard/edit/${product._id}`}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            {t('products.edit')}
                                        </Link>
                                    </Button>

                                    <form action={async () => {
                                        if (confirm("Are you sure?")) {
                                            await onDelete(product._id);
                                        }
                                    }} className="flex">
                                        <Button variant="destructive" size="default" type="submit" className="w-full rounded-xl h-11 font-bold text-xs bg-destructive/5 hover:bg-destructive shadow-none text-destructive hover:text-destructive-foreground border border-destructive/20 transition-all">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            {t('products.delete')}
                                        </Button>
                                    </form>
                                </div>
                            </div>

                            {/* Hover Decorative Glow */}
                            <div className="absolute inset-0 ring-1 ring-inset ring-primary/0 group-hover:ring-primary/20 rounded-[1.5rem] transition-all pointer-events-none" />
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full text-center py-24 bg-card/40 backdrop-blur-sm rounded-[2.5rem] border-2 border-dashed border-border/50 hover:border-primary/30 transition-colors">
                        <div className="inline-flex p-8 bg-muted/50 rounded-full mb-8 relative">
                            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-20" />
                            <Package className="h-14 w-14 text-muted-foreground opacity-30" />
                        </div>
                        <h3 className="text-2xl font-black mb-3">{t('products.noProducts')}</h3>
                        <p className="text-muted-foreground mb-10 max-w-sm mx-auto font-medium">
                            Ready to share your workflow with the world? Your first blueprint is just a click away.
                        </p>
                        <Button asChild className="rounded-2xl h-14 px-10 font-bold text-lg shadow-2xl shadow-primary/20">
                            <Link href="/sell">{t('products.startSelling')}</Link>
                        </Button>
                    </div>
                )}
            </div>
        </section>
    );
}
