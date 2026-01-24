import { connectToDatabase } from "@/lib/db";
import Automation from "@/models/Automation";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { CheckCircle2, Download, Home, ArrowRight, Package, ShieldCheck } from "lucide-react";
import Link from "next/link";
import Stripe from "stripe";
import { notFound, redirect } from "next/navigation";
import { getDownloadUrl } from "@/lib/s3";
import CartCleaner from "./cart-cleaner"; // Import du nettoyeur

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

interface SuccessPageProps {
    searchParams: Promise<{ session_id: string }>;
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
    const { session_id } = await searchParams;

    if (!session_id) redirect("/");

    let session;
    try {
        session = await stripe.checkout.sessions.retrieve(session_id);
    } catch (error) {
        console.error("Erreur Stripe:", error);
        notFound();
    }

    //On récupère 'productIds' (pluriel)
    const productIdsString = session.metadata?.productIds;
    if (!productIdsString) {
        // Fallback: si c'est un achat unique (ancienne version), on tente de récupérer le productId unique
        if (!session.metadata?.productId) notFound();
    }

    await connectToDatabase();

    let products = [];

    // Logique pour gérer soit un panier (tableau), soit un produit unique
    if (productIdsString) {
        const productIds = JSON.parse(productIdsString);
        products = await Automation.find({ _id: { $in: productIds } }).lean();
    } else if (session.metadata?.productId) {
        const singleProduct = await Automation.findById(session.metadata.productId).lean();
        if (singleProduct) products.push(singleProduct);
    }

    if (products.length === 0) notFound();

    // Génération des liens de téléchargement pour chaque produit
    const productsWithLinks = await Promise.all(products.map(async (p: any) => {
        let secureUrl = "#";
        try {
            if (p.fileUrl) {
                const fileKey = p.fileUrl.split('.com/')[1];
                secureUrl = await getDownloadUrl(fileKey);
            }
        } catch (e) {
            console.error(`Erreur lien pour ${p.title}`, e);
        }
        return { ...p, secureUrl };
    }));

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4 py-20">
            {/* 👇 Le nettoyeur s'exécute silencieusement ici */}
            <CartCleaner />

            <Card className="max-w-2xl w-full border-border/50 shadow-2xl bg-card/50 backdrop-blur">
                <CardHeader className="text-center pb-6">
                    <div className="flex justify-center mb-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-green-500 blur-2xl opacity-20 animate-pulse"></div>
                            <CheckCircle2 className="h-20 w-20 text-green-500 relative" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-extrabold tracking-tight">
                        Paiement Confirmé !
                    </CardTitle>
                    <p className="text-muted-foreground mt-2">
                        Merci pour votre confiance. Vous avez acheté {products.length} automation{products.length > 1 ? 's' : ''}.
                    </p>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Liste des produits achetés */}
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        {productsWithLinks.map((product) => (
                            <div key={product._id} className="p-4 rounded-xl bg-muted/50 border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <Package className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-semibold truncate">{product.title}</span>
                                        <span className="text-xs text-muted-foreground">{product.price} €</span>
                                    </div>
                                </div>

                                <Button asChild size="sm" variant="outline" className="shrink-0">
                                    <a href={product.secureUrl} download={`${product.title}.json`}>
                                        <Download className="mr-2 h-4 w-4" />
                                        Télécharger
                                    </a>
                                </Button>
                            </div>
                        ))}
                    </div>

                    <div className="text-center">
                        <p className="text-[11px] text-muted-foreground italic mb-4">
                            Ces liens sont temporaires. Retrouvez vos achats à tout moment dans votre Dashboard.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <Button variant="outline" asChild className="w-full">
                            <Link href="/">
                                <Home className="mr-2 h-4 w-4" />
                                Accueil
                            </Link>
                        </Button>
                        <Button asChild className="w-full">
                            <Link href="/dashboard" className="flex items-center">
                                Voir mes achats
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}