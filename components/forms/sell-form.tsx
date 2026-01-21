"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAutomation } from "@/app/actions/automation"; // Ta Server Action existante
import FileUpload from "@/components/FileUpload"; // Ton composant Upload existant

// Imports UI (Design)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UploadCloud, Loader2 } from "lucide-react";

export function SellForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fileUrl, setFileUrl] = useState("");

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        price: 0,
        category: "n8n",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // c'est la verification de fichier que je desactive pour l'instant pour faire des tests
        // if (!fileUrl) return alert("Veuillez uploader votre fichier d'automatisation"); 

        setLoading(true);
        try {
            await createAutomation({ ...formData, fileUrl });
            alert("Produit mis en ligne !");
            router.push("/");
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la mise en vente");
        } finally {
            setLoading(false);
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
                        <Label htmlFor="title">Titre de l'automatisation</Label>
                        <Input
                            id="title"
                            placeholder="Ex: LinkedIn Scraper Pro v2"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    {/* Catégorie & Prix */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="category">Catégorie</Label>
                            {/* Attention: Shadcn Select fonctionne avec onValueChange, pas onChange */}
                            <Select
                                defaultValue={formData.category}
                                onValueChange={(value) => setFormData({ ...formData, category: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Choisir..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="n8n">n8n</SelectItem>
                                    <SelectItem value="Make">Make</SelectItem>
                                    <SelectItem value="Zapier">Zapier</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="price">Prix (€)</Label>
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
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Décrivez ce que fait votre script..."
                            className="min-h-[150px]"
                            required
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    {/* Zone d'upload */}
                    <div className="space-y-2">
                        <Label>Fichier JSON de l'automatisation</Label>
                        <div className="border-2 border-dashed rounded-lg p-6 hover:bg-muted/50 transition-colors">
                            {!fileUrl ? (
                                <div className="flex flex-col items-center justify-center text-center">
                                    <UploadCloud className="h-10 w-10 text-muted-foreground mb-4" />
                                    {/* Ton composant FileUpload est ici */}
                                    <FileUpload onUploadSuccess={(url) => setFileUrl(url)} />
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
                    {/* rajouter || !fileUrl dans disabled plus tard */}
                    <Button type="submit" size="lg" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {loading ? "Publication..." : "Publier sur Koda"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}