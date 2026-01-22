"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProduct } from "@/app/actions/product-management";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Loader2 } from "lucide-react";
import FileUpload from "@/app/components/FileUpload"; // Import du composant Upload

interface EditFormProps {
    product: {
        _id: string;
        title: string;
        description: string;
        price: number;
        previewImageUrl?: string;
    };
}

export function EditForm({ product }: EditFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // On initialise avec les données existantes
    const [formData, setFormData] = useState({
        title: product.title,
        description: product.description,
        price: product.price,
        previewImageUrl: product.previewImageUrl || "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await updateProduct(product._id, formData);
            alert("Produit mis à jour !");
            router.push("/dashboard");
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la mise à jour");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Modifier {product.title}</CardTitle>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Titre</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="price">Prix (€)</Label>
                        <Input
                            id="price"
                            type="number"
                            min="0"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Image de prévisualisation</Label>
                        <div className="border-2 border-dashed rounded-lg p-2 hover:bg-muted/50 transition-colors">
                            {!formData.previewImageUrl ? (
                                <FileUpload
                                    onUploadSuccess={(url) => setFormData({ ...formData, previewImageUrl: url })}
                                    accept="image/*"
                                    label="Changer l'image de couverture"
                                />
                            ) : (
                                <div className="space-y-2">
                                    <img src={formData.previewImageUrl} alt="Preview" className="w-full h-48 object-cover rounded-md" />
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        type="button"
                                        onClick={() => setFormData({ ...formData, previewImageUrl: "" })}
                                        className="w-full"
                                    >
                                        Supprimer / Changer l'image
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            className="min-h-[150px]"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline" type="button" onClick={() => router.back()}>
                        Annuler
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Enregistrer
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
