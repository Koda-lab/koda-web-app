"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAutomation } from "@/app/actions/automation";
import FileUpload from "@/app/components/FileUpload";
import { getPublicImageUrl } from "@/lib/image-helper";
import { toast } from "sonner";
import { ProductCategory } from "@/types/product";
import { AutomationPlatform } from "@/types/automation";

// Imports UI (Design)
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Badge } from "@/app/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/app/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { UploadCloud, Loader2, X, Info, FileJson, Image as ImageIcon, Sparkles } from "lucide-react";
import Image from "next/image";
import { Separator } from "@/app/components/ui/separator";

export function SellForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fileUrl, setFileUrl] = useState("");
    const [previewImageUrl, setPreviewImageUrl] = useState("");
    const [tagInput, setTagInput] = useState("");

    const [formData, setFormData] = useState<{
        title: string;
        description: string;
        price: number;
        category: ProductCategory;
        platform: AutomationPlatform;
        tags: string[];
        version?: string;
    }>({
        title: "",
        description: "",
        price: 0,
        category: ProductCategory.PRODUCTIVITY,
        platform: "n8n",
        tags: [],
        version: "",
    });

    const handleAddTag = () => {
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
            setTagInput("");
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setFormData({ ...formData, tags: formData.tags.filter(tag => tag !== tagToRemove) });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // c'est la verification de fichier que je desactive pour l'instant pour faire des tests
        // if (!fileUrl) return alert("Veuillez uploader votre fichier d'automatisation"); 

        setLoading(true);
        const toastId = toast.loading("Publication en cours...");
        try {
            await createAutomation({
                ...formData,
                fileUrl,
                previewImageUrl,
                version: formData.version || undefined,
            });
            toast.success("Produit mis en ligne avec succès !");
            router.push("/");
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Erreur lors de la mise en vente");
        } finally {
            setLoading(false);
            toast.dismiss(toastId);
        }
    };

    return (
        <Card className="w-full border-border/50 shadow-2xl bg-card">
            <CardHeader className="border-b border-border/50 pb-8 space-y-2">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 rounded-lg">
                        <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold">Détails de l'automatisation</CardTitle>
                        <CardDescription className="text-base">
                            Remplissez les informations ci-dessous pour publier votre blueprint sur le marché.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-10 pt-8">

                    {/* Section 1: Informations Générales */}
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Titre */}
                            <div className="space-y-2.5">
                                <Label htmlFor="title" className="text-base font-medium">Titre du produit <span className="text-destructive">*</span></Label>
                                <Input
                                    id="title"
                                    placeholder="Ex: LinkedIn Scraper Pro v2"
                                    required
                                    className="h-11 text-lg"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">Donnez un nom clair et accrocheur.</p>
                            </div>

                            {/* Prix */}
                            <div className="space-y-2.5">
                                <Label htmlFor="price" className="text-base font-medium">Prix (€) <span className="text-destructive">*</span></Label>
                                <div className="relative">
                                    <Input
                                        id="price"
                                        type="number"
                                        min="0"
                                        placeholder="49"
                                        className="pr-8 h-11 text-lg font-mono"
                                        required
                                        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">€</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Votre revenu net sera calculé après commission.</p>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2.5">
                            <Label htmlFor="description" className="text-base font-medium">Description complète <span className="text-destructive">*</span></Label>
                            <Textarea
                                id="description"
                                placeholder="Décrivez les fonctionnalités, les pré-requis et la valeur ajoutée de votre script..."
                                className="min-h-[160px] text-base leading-relaxed resize-y"
                                required
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    <Separator className="bg-border/60" />

                    {/* Section 2: Catégorisation */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Info className="h-5 w-5 text-muted-foreground" />
                            Classification
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2.5">
                                <Label htmlFor="platform">Plateforme <span className="text-destructive">*</span></Label>
                                <Select
                                    defaultValue={formData.platform}
                                    onValueChange={(value) => setFormData({ ...formData, platform: value as AutomationPlatform })}
                                >
                                    <SelectTrigger className="h-11">
                                        <SelectValue placeholder="Choisir..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="n8n">n8n</SelectItem>
                                        <SelectItem value="Make">Make</SelectItem>
                                        <SelectItem value="Zapier">Zapier</SelectItem>
                                        <SelectItem value="Python">Python</SelectItem>
                                        <SelectItem value="Other">Autre</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2.5">
                                <Label htmlFor="category">Catégorie <span className="text-destructive">*</span></Label>
                                <Select
                                    defaultValue={formData.category}
                                    onValueChange={(value) => setFormData({ ...formData, category: value as ProductCategory })}
                                >
                                    <SelectTrigger className="h-11">
                                        <SelectValue placeholder="Choisir..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={ProductCategory.SOCIAL_MEDIA}>Social Media</SelectItem>
                                        <SelectItem value={ProductCategory.EMAIL_MARKETING}>Email Marketing</SelectItem>
                                        <SelectItem value={ProductCategory.PRODUCTIVITY}>Productivity</SelectItem>
                                        <SelectItem value={ProductCategory.SALES}>Sales</SelectItem>
                                        <SelectItem value={ProductCategory.OTHER}>Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Tags & Version */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2.5">
                                <Label htmlFor="version">Version <span className="text-muted-foreground font-normal">(Optionnel)</span></Label>
                                <Input
                                    id="version"
                                    placeholder="Ex: v1.0.0"
                                    className="h-11"
                                    value={formData.version}
                                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2.5">
                                <Label htmlFor="tags">Tags <span className="text-muted-foreground font-normal">(Mots-clés pour la recherche)</span></Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="tags"
                                        placeholder="Ajouter un tag..."
                                        value={tagInput}
                                        className="h-11"
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddTag();
                                            }
                                        }}
                                    />
                                    <Button type="button" onClick={handleAddTag} variant="secondary" className="h-11 px-4">
                                        Ajouter
                                    </Button>
                                </div>
                                {formData.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3 p-3 bg-muted/40 rounded-lg border border-border/50">
                                        {formData.tags.map((tag) => (
                                            <Badge key={tag} variant="secondary" className="pl-2.5 pr-1 py-1 text-sm">
                                                {tag}
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-4 w-4 p-0 ml-2 text-muted-foreground hover:text-destructive"
                                                    onClick={() => handleRemoveTag(tag)}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <Separator className="bg-border/60" />

                    {/* Section 3: Fichiers */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Zone d'upload Image */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <ImageIcon className="h-5 w-5 text-primary" />
                                <Label className="text-base font-semibold">Image de couverture</Label>
                            </div>

                            <FileUpload
                                onUploadSuccess={(url) => setPreviewImageUrl(url)}
                                accept="image/*"
                                className={`border-2 border-dashed rounded-xl p-2 transition-all duration-200 h-64 ${!previewImageUrl ? "hover:bg-accent/50 hover:border-primary/50 border-border" : "border-border"}`}
                            >
                                {!previewImageUrl ? (
                                    <div className="flex flex-col items-center justify-center text-center p-6 space-y-3 h-full w-full">
                                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">Glisser-déposer ou cliquer</p>
                                            <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP (Max 2MB)</p>
                                        </div>
                                        <div className="mt-4">
                                            <span className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors">
                                                Choisir un fichier
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
                                            <p className="text-white font-medium text-sm">Changer l'image</p>
                                        </div>
                                    </div>
                                )}
                            </FileUpload>
                        </div>

                        {/* Zone d'upload JSON */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <FileJson className="h-5 w-5 text-primary" />
                                <Label className="text-base font-semibold">Fichier Source (JSON)</Label>
                                <span className="text-destructive text-sm">*</span>
                            </div>

                            <FileUpload
                                onUploadSuccess={(url) => setFileUrl(url)}
                                accept=".json"
                                className={`border-2 border-dashed rounded-xl p-6 h-64 flex flex-col items-center justify-center transition-all duration-200 ${!fileUrl ? "hover:bg-accent/50 hover:border-primary/50 bg-muted/20 border-border" : "border-green-500/50 bg-green-500/5"}`}
                            >
                                {!fileUrl ? (
                                    <div className="flex flex-col items-center justify-center text-center space-y-4 w-full h-full">
                                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                                            <UploadCloud className="h-8 w-8 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-lg">Fichier d'automatisation</p>
                                            <p className="text-sm text-muted-foreground mt-1">Format .json uniquement</p>
                                        </div>
                                        <div className="mt-2">
                                            <span className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                                                Sélectionner le fichier
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center space-y-4 text-center w-full h-full">
                                        <div className="w-16 h-16 bg-green-500/20 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center ring-4 ring-green-500/10">
                                            <FileJson className="h-8 w-8" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-lg text-green-700 dark:text-green-400">Fichier prêt !</p>
                                            <p className="text-xs text-muted-foreground mt-1 break-all px-4 max-w-xs mx-auto">{fileUrl.split('/').pop()}</p>
                                        </div>
                                        <div className="px-4 py-2 border rounded-full text-xs text-muted-foreground bg-background hover:bg-muted transition-colors">
                                            Cliquez pour remplacer
                                        </div>
                                    </div>
                                )}
                            </FileUpload>
                        </div>
                    </div>

                </CardContent>

                <CardFooter className="flex justify-end gap-4 border-t border-border/50 p-8 bg-muted/20 rounded-b-xl">
                    <Button variant="ghost" type="button" onClick={() => router.back()} size="lg">
                        Annuler
                    </Button>
                    <Button type="submit" size="lg" disabled={loading || !fileUrl} className="min-w-[180px] shadow-lg shadow-primary/20">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {loading ? "Publication..." : "Publier sur Koda"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}