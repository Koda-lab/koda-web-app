"use client";

import { useState, useTransition } from "react";
import { toggleProductCertification, getAdminDownloadUrl } from "@/app/actions/admin";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { CheckCircle2, XCircle, Download, Loader2, ShieldCheck, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface AdminProductTableProps {
    products: any[];
}

export function AdminProductTable({ products }: AdminProductTableProps) {
    const [isPending, startTransition] = useTransition();
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const t = useTranslations('Admin');

    const handleToggleCertification = (productId: string, currentStatus: boolean) => {
        startTransition(async () => {
            try {
                const result = await toggleProductCertification(productId, !currentStatus);
                if (result.success) {
                    toast.success(!currentStatus ? t('productsTable.toasts.certified') : t('productsTable.toasts.decertified'));
                }
            } catch (error: any) {
                toast.error(error.message || t('productsTable.toasts.error'));
            }
        });
    };

    const handleDownload = async (productId: string) => {
        setDownloadingId(productId);
        try {
            const result = await getAdminDownloadUrl(productId);
            if (result.success && result.url) {
                window.open(result.url, "_blank");
            }
        } catch (error: any) {
            toast.error(error.message || t('productsTable.toasts.downloadError'));
        } finally {
            setDownloadingId(null);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-950 rounded-lg shadow overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
                <thead className="bg-gray-100 dark:bg-gray-900 border-b">
                    <tr>
                        <th className="p-4">{t('productsTable.product')}</th>
                        <th className="p-4">{t('productsTable.seller')}</th>
                        <th className="p-4">{t('productsTable.price')}</th>
                        <th className="p-4">{t('productsTable.status')}</th>
                        <th className="p-4 text-right">{t('productsTable.actions')}</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((product) => (
                        <tr key={product._id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900">
                            <td className="p-4">
                                <div className="font-semibold">{product.title}</div>
                                <div className="text-xs text-muted-foreground capitalize">
                                    {product.category} • {product.platform || product.productType}
                                </div>
                            </td>
                            <td className="p-4 text-sm">
                                {product.seller?.username || t('usersTable.seller')}
                            </td>
                            <td className="p-4 text-sm font-mono">
                                {product.price}€
                            </td>
                            <td className="p-4">
                                {product.isCertified ? (
                                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 gap-1 border-green-200">
                                        <ShieldCheck className="w-3 h-3" /> {t('productsTable.certified')}
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-muted-foreground gap-1 border-dashed">
                                        <ShieldAlert className="w-3 h-3" /> {t('productsTable.unverified')}
                                    </Badge>
                                )}
                            </td>
                            <td className="p-4 flex justify-end items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownload(product._id)}
                                    disabled={downloadingId === product._id}
                                    className="h-8 gap-1.5"
                                >
                                    {downloadingId === product._id ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <Download className="w-3.5 h-3.5" />
                                    )}
                                    {t('productsTable.test')}
                                </Button>

                                <Button
                                    variant={product.isCertified ? "destructive" : "default"}
                                    size="sm"
                                    onClick={() => handleToggleCertification(product._id, product.isCertified)}
                                    disabled={isPending}
                                    className="h-8 min-w-[100px]"
                                >
                                    {isPending ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : product.isCertified ? (
                                        <>
                                            <ShieldAlert className="w-3.5 h-3.5 mr-1.5" /> {t('productsTable.decertify')}
                                        </>
                                    ) : (
                                        <>
                                            <ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> {t('productsTable.certify')}
                                        </>
                                    )}
                                </Button>

                            </td>
                        </tr>
                    ))}
                    {products.length === 0 && (
                        <tr>
                            <td colSpan={5} className="p-8 text-center text-muted-foreground italic">
                                {t('productsTable.noProducts')}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
