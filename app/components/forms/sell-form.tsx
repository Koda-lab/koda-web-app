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
import { UploadCloud, Loader2, X } from "lucide-react";
import Image from "next/image";

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
        <Card className="w-full max-w-2xl mx-auto border-muted-foreground/20 shadow-xl">
            <CardHeader>
                <CardTitle className="text-2xl">Vendre une automatisation</CardTitle>
                <CardDescription>
                    Remplissez les détails pour publier votre blueprint sur la marketplace.
                </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6">

                    {/* Titre */}
                    <div className="space-y-2">
                        <Label htmlFor="title">Titre de l'automatisation <span className="text-destructive">*</span></Label>
                        <Input
                            id="title"
                            placeholder="Ex: LinkedIn Scraper Pro v2"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    {/* Plateforme & Catégorie */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="platform">Plateforme <span className="text-destructive">*</span></Label>
                            <Select
                                defaultValue={formData.platform}
                                onValueChange={(value) => setFormData({ ...formData, platform: value as AutomationPlatform })}
                            >
                                <SelectTrigger>
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

                        <div className="space-y-2">
                            <Label htmlFor="category">Catégorie <span className="text-destructive">*</span></Label>
                            <Select
                                defaultValue={formData.category}
                                onValueChange={(value) => setFormData({ ...formData, category: value as ProductCategory })}
                            >
                                <SelectTrigger>
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

                    {/* Prix & Version */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="price">Prix (€) <span className="text-destructive">*</span></Label>
                            <div className="relative">
                                <Input
                                    id="price"
                                    type="number"
                                    min="0"
                                    placeholder="49"
                                    className="pr-8"
                                    required
                                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="version">Version <span className="text-muted-foreground font-normal">(Optionnel)</span></Label>
                            <Input
                                id="version"
                                placeholder="v1.0.0"
                                value={formData.version}
                                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description <span className="text-destructive">*</span></Label>
                        <Textarea
                            id="description"
                            placeholder="Décrivez ce que fait votre script..."
                            className="min-h-[150px]"
                            required
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                        <Label htmlFor="tags">Tags <span className="text-muted-foreground font-normal">(Optionnel)</span></Label>
                        <div className="flex gap-2">
                            <Input
                                id="tags"
                                placeholder="Ajouter un tag..."
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddTag();
                                    }
                                }}
                            />
                            <Button type="button" onClick={handleAddTag} variant="outline">
                                Ajouter
                            </Button>
                        </div>
                        {formData.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {formData.tags.map((tag) => (
                                    <Badge key={tag} variant="secondary" className="pl-2 pr-1">
                                        {tag}
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-4 w-4 p-0 ml-1"
                                            onClick={() => handleRemoveTag(tag)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Zone d'upload Image de Démo */}
                    <div className="space-y-2">
                        <Label>Image de prévisualisation <span className="text-muted-foreground font-normal">(Optionnel)</span></Label>
                        <div className="border-2 border-dashed rounded-lg p-2 hover:bg-muted/50 transition-colors">
                            {!previewImageUrl ? (
                                <FileUpload
                                    onUploadSuccess={(url) => setPreviewImageUrl(url)}
                                    accept="image/*"
                                />
                            ) : (
                                <div className="space-y-2">
                                    <Image
                                        src={getPublicImageUrl(previewImageUrl)}
                                        alt="Preview"
                                        width={600}
                                        height={300}
                                        className="w-full h-48 object-cover rounded-md"
                                        unoptimized
                                    />
                                    <Button variant="destructive" size="sm" onClick={() => setPreviewImageUrl("")} className="w-full">
                                        Supprimer l'image
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Zone d'upload */}
                    <div className="space-y-2">
                        <Label>Fichier JSON de l'automatisation <span className="text-destructive">*</span></Label>
                        <div className="border-2 border-dashed rounded-lg p-6 hover:bg-muted/50 transition-colors">
                            {!fileUrl ? (
                                <div className="flex flex-col items-center justify-center text-center">
                                    <UploadCloud className="h-10 w-10 text-muted-foreground mb-4" />
                                    {/* Ton composant FileUpload est ici */}
                                    <FileUpload
                                        onUploadSuccess={(url) => setFileUrl(url)}
                                        accept=".json"
                                        label="Uploader le fichier .JSON"
                                    />
                                </div>
                            ) : (
                                <div className="flex items-center justify-center text-green-600 font-medium bg-green-50 p-4 rounded-md border border-green-200">
                                    ✓ Fichier prêt à être publié
                                </div>
                            )}
                        </div>
                    </div>

                </CardContent>

                <CardFooter className="flex justify-end gap-4 border-t pt-6">
                    <Button variant="ghost" type="button" onClick={() => router.back()}>
                        Annuler
                    </Button>
                    <Button type="submit" size="lg" disabled={loading || !fileUrl}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {loading ? "Publication..." : "Publier sur Koda"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}