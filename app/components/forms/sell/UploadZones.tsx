import { Label } from "@/app/components/ui/label";
import { FileJson, Image as ImageIcon, UploadCloud } from "lucide-react";
import FileUpload from "@/app/components/FileUpload";
import Image from "next/image";
import { getPublicImageUrl } from "@/lib/image-helper";
import { useTranslations } from "next-intl";

interface UploadZonesProps {
    previewImageUrl: string;
    fileUrl: string;
    onPreviewImageUpload: (url: string) => void;
    onFileUpload: (url: string) => void;
}

export function UploadZones({
    previewImageUrl,
    fileUrl,
    onPreviewImageUpload,
    onFileUpload
}: UploadZonesProps) {
    const t = useTranslations('Sell.form.upload');
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Zone d'upload Image */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <ImageIcon className="h-5 w-5 text-primary" />
                    <Label className="text-base font-semibold">{t('cover')}</Label>
                </div>

                <FileUpload
                    onUploadSuccess={onPreviewImageUpload}
                    accept="image/*"
                    label="cover-upload"
                    endpoint="/api/image"
                    className={`border-2 border-dashed rounded-xl p-2 transition-all duration-200 h-64 ${!previewImageUrl ? "hover:bg-accent/50 hover:border-primary/50 border-border" : "border-border"}`}
                >
                    {!previewImageUrl ? (
                        <div className="flex flex-col items-center justify-center text-center p-6 space-y-3 h-full w-full">
                            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="font-medium text-sm">{t('drop')}</p>
                                <p className="text-xs text-muted-foreground mt-1">{t('dropDesc')}</p>
                            </div>
                            <div className="mt-4">
                                <span className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors">
                                    {t('choose')}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="relative w-full h-full rounded-lg overflow-hidden group">
                            <Image
                                src={getPublicImageUrl(previewImageUrl)}
                                alt="Preview"
                                fill
                                className="object-cover"
                                unoptimized
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <p className="text-white font-medium text-sm">{t('change')}</p>
                            </div>
                        </div>
                    )}
                </FileUpload>
            </div>

            {/* Zone d'upload JSON */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <FileJson className="h-5 w-5 text-primary" />
                    <Label className="text-base font-semibold">{t('source')}</Label>
                    <span className="text-destructive text-sm">*</span>
                </div>

                <FileUpload
                    onUploadSuccess={onFileUpload}
                    accept=".json"
                    label="source-upload"
                    className={`border-2 border-dashed rounded-xl p-6 h-64 flex flex-col items-center justify-center transition-all duration-200 ${!fileUrl ? "hover:bg-accent/50 hover:border-primary/50 bg-muted/20 border-border" : "border-green-500/50 bg-green-500/5"}`}
                >
                    {!fileUrl ? (
                        <div className="flex flex-col items-center justify-center text-center space-y-4 w-full h-full">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                                <UploadCloud className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                                <p className="font-medium text-lg">{t('blueprint')}</p>
                                <p className="text-sm text-muted-foreground mt-1">{t('blueprintFormat')}</p>
                            </div>
                            <div className="mt-2">
                                <span className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                                    {t('select')}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center space-y-4 text-center w-full h-full">
                            <div className="w-16 h-16 bg-green-500/20 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center ring-4 ring-green-500/10">
                                <FileJson className="h-8 w-8" />
                            </div>
                            <div>
                                <p className="font-semibold text-lg text-green-700 dark:text-green-400">{t('ready')}</p>
                                <p className="text-xs text-muted-foreground mt-1 break-all px-4 max-w-xs mx-auto">{fileUrl.split('/').pop()}</p>
                            </div>
                            <div className="px-4 py-2 border rounded-full text-xs text-muted-foreground bg-background hover:bg-muted transition-colors">
                                {t('replace')}
                            </div>
                        </div>
                    )}
                </FileUpload>
            </div>
        </div>
    );
}
