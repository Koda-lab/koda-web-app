import { connectToDatabase } from "@/lib/db";
import Automation from "@/models/Automation";
import { notFound } from "next/navigation";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import { getPublicImageUrl } from "@/lib/image-helper";
import { ChevronLeft, Download, ShieldCheck, Zap, User } from "lucide-react";
import Link from "next/link";
import { createClerkClient } from "@clerk/nextjs/server"; // Import pour le serveur
import { createCheckoutSession } from "@/app/actions/transaction"; // Import de l'action de transaction
import { redirect } from "next/navigation";

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

interface ProductPageProps {
    params: Promise<{ id: string }>;
}

import { auth } from "@clerk/nextjs/server";
import { getDownloadUrl } from "@/lib/s3";
import Purchase from "@/models/Purchase";

export default async function ProductPage({ params }: ProductPageProps) {
    const { id } = await params;
    const { userId } = await auth();

    await connectToDatabase();
    const product = await Automation.findById(id).lean();

    if (!product) {
        notFound();
    }

    // VÉRIFICATION DE L'ACHAT
    let hasPurchased = false;
    let secureDownloadUrl = "#";

    if (userId) {
        const purchase = await Purchase.findOne({
            buyerId: userId,
            productId: id
        });

        if (purchase) {
            hasPurchased = true;
            try {
                // Générer le lien S3 sécurisé
                const fileKey = product.fileUrl.split('.com/')[1];
                secureDownloadUrl = await getDownloadUrl(fileKey);
            } catch (e) {
                console.error("Erreur génération lien S3:", e);
            }
        }
    }

    // RÉCUPÉRATION DES INFOS DU VENDEUR VIA CLERK
    let sellerName = "Vendeur vérifié";
    let sellerImageUrl = null;

    try {
        const seller = await clerkClient.users.getUser(product.sellerId);
        sellerName = seller.username || `${seller.firstName} ${seller.lastName}` || "Utilisateur Koda";
        sellerImageUrl = seller.imageUrl;
    } catch (error) {
        console.error("Erreur lors de la récupération du vendeur Clerk:", error);
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto py-8 px-4 max-w-6xl">
                <Button variant="ghost" asChild className="mb-6 -ml-2 text-muted-foreground hover:text-primary">
                    <Link href="/">
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Retour au catalogue
                    </Link>
                </Button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* COLONNE GAUCHE */}
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="overflow-hidden border-border/50 bg-card/50 backdrop-blur">
                            <div className="aspect-video bg-muted flex items-center justify-center border-b relative group">
                                {product.previewImageUrl ? (
                                    <img
                                        src={getPublicImageUrl(product.previewImageUrl)}
                                        alt={product.title}
                                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                        <Zap size={48} className="opacity-20" />
                                        <span className="text-sm font-medium">Aperçu de l'automatisation {product.category}</span>
                                    </div>
                                )}
                            </div>
                            <CardContent className="p-8">
                                <div className="flex items-center gap-3 mb-4">
                                    <Badge variant="outline" className="capitalize">
                                        {product.category}
                                    </Badge>
                                    {hasPurchased && (
                                        <Badge className="bg-green-600 hover:bg-green-700 text-white gap-1">
                                            <ShieldCheck className="h-3 w-3" />
                                            Acheté
                                        </Badge>
                                    )}
                                </div>

                                <h1 className="text-4xl font-extrabold tracking-tight mb-6 italic">
                                    {product.title}
                                </h1>

                                <div className="prose prose-stone dark:prose-invert max-w-none">
                                    <h3 className="text-lg font-semibold mb-3">À propos de cette automatisation</h3>
                                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                        {product.description}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Avantages */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="p-4 border-border/40 bg-card/30">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                        <Download size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-sm">Accès immédiat</h4>
                                        <p className="text-xs text-muted-foreground text-pretty">Téléchargez le fichier JSON dès la confirmation du paiement.</p>
                                    </div>
                                </div>
                            </Card>
                            <Card className="p-4 border-border/40 bg-card/30">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-sm">Vérifié par Koda</h4>
                                        <p className="text-xs text-muted-foreground text-pretty">La structure du fichier est validée pour éviter les erreurs d'importation.</p>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* COLONNE DROITE */}
                    <div className="space-y-6">
                        <Card className="border-border/50 shadow-xl sticky top-24 bg-card/80 backdrop-blur">
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-2">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Prix de licence</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-bold">{product.price}</span>
                                        <span className="text-xl font-semibold text-primary">€</span>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-4">
                                    {hasPurchased ? (
                                        <div className="space-y-3">
                                            <Button
                                                asChild
                                                className="w-full text-lg h-14 shadow-lg shadow-green-500/20 bg-green-600 hover:bg-green-700 text-white"
                                                size="lg"
                                            >
                                                <a href={secureDownloadUrl} download={`${product.title}.json`}>
                                                    <Download className="mr-3 h-6 w-6" />
                                                    Télécharger maintenant
                                                </a>
                                            </Button>
                                            <p className="text-xs text-center text-muted-foreground">
                                                Vous possédez déjà ce produit ✅
                                            </p>
                                        </div>
                                    ) : (
                                        <form
                                            action={async () => {
                                                "use server";
                                                const url = await createCheckoutSession(id);
                                                if (url) redirect(url);
                                            }}
                                        >
                                            <Button
                                                type="submit"
                                                className="w-full text-lg h-14 shadow-lg shadow-primary/20"
                                                size="lg"
                                            >
                                                Acheter maintenant
                                            </Button>
                                        </form>
                                    )}
                                </div>

                                {/* BLOC VENDEUR AMÉLIORÉ */}
                                <div className="pt-4 flex items-center gap-3 border-t mt-4">
                                    {sellerImageUrl ? (
                                        <img src={sellerImageUrl} alt={sellerName} className="h-10 w-10 rounded-full border" />
                                    ) : (
                                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                                            <User size={20} className="text-muted-foreground" />
                                        </div>
                                    )
                                    }
                                    < div className="flex flex-col">
                                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Vendu par</span>
                                        <span className="text-sm font-semibold text-primary">{sellerName}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div >
    );
}
