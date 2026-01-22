import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";

//component pour afficher les produits sur la page d'accueil en format de carte. 

interface ProductCardProps {
    id: string;
    title: string;
    description: string;
    price: number;
    category: string;
}

export function ProductCard({ id, title, description, price, category }: ProductCardProps) {
    return (
        <Card className="flex flex-col h-full hover:shadow-lg transition-all duration-300 border-border/50">
            <CardHeader className="p-4">
                <div className="flex justify-between items-start gap-2">
                    <Badge variant="secondary" className="text-xs font-medium">
                        {category}
                    </Badge>
                    <span className="font-bold text-lg text-primary">{price} €</span>
                </div>
            </CardHeader>

            <CardContent className="p-4 pt-0 flex-grow">
                <h3 className="font-bold text-xl mb-2 line-clamp-1">{title}</h3>
                <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">
                    {description}
                </p>
            </CardContent>

            <CardFooter className="p-4 pt-0 mt-auto">
                <Button asChild className="w-full bg-primary/90 hover:bg-primary" size="lg">
                    <Link href={`/product/${id}`}>
                        Voir le détail
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}