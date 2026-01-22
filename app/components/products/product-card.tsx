"use client";

import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { ShoppingCart } from "lucide-react"; // Icône pour le panier
import { useCart } from "@/hooks/use-cart";   // Ton hook panier
import { IAutomation } from "@/types/automation";

interface ProductCardProps {
    product: IAutomation; // On passe l'objet entier pour le panier
}

export function ProductCard({ product }: ProductCardProps) {
    const cart = useCart();

    // Gestion du clic "Ajouter au panier"
    const onAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault(); // Empêche la navigation si la carte était un lien
        e.stopPropagation();
        cart.addItem(product);
    };

    return (
        <Card className="flex flex-col h-full hover:shadow-lg transition-all duration-300 border-border/50 group">
            <CardHeader className="p-4">
                <div className="flex justify-between items-start gap-2">
                    <Badge variant="secondary" className="text-xs font-medium">
                        {product.category}
                    </Badge>
                    <span className="font-bold text-lg text-primary">{product.price} €</span>
                </div>
            </CardHeader>

            <CardContent className="p-4 pt-0 flex-grow">
                {/* On utilise product.title et product.description */}
                <h3 className="font-bold text-xl mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                    {product.title}
                </h3>
                <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">
                    {product.description}
                </p>
            </CardContent>

            <CardFooter className="p-4 pt-0 mt-auto flex gap-2">
                {/* Bouton Voir le détail */}
                <Button asChild variant="outline" className="flex-1" size="lg">
                    <Link href={`/product/${product._id}`}>
                        Détails
                    </Link>
                </Button>

                {/* Bouton Ajouter au panier */}
                <Button
                    onClick={onAddToCart}
                    className="flex-1 bg-primary/90 hover:bg-primary"
                    size="lg"
                >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Ajouter
                </Button>
            </CardFooter>
        </Card>
    );
}