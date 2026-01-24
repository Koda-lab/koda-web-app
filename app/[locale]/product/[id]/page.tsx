import { connectToDatabase } from "@/lib/db";
import Automation from "@/models/Automation";
import { notFound } from "next/navigation";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import { getPublicImageUrl } from "@/lib/image-helper";
import { ChevronLeft, Download, ShieldCheck, Zap, User, Package, MessageSquare } from "lucide-react";
import Link from "next/link";
import { createClerkClient } from "@clerk/nextjs/server";
import { createSingleProductCheckout } from "@/app/actions/transaction";
import { redirect } from "next/navigation";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import { getDownloadUrl } from "@/lib/s3";
import Purchase from "@/models/Purchase";
import { Metadata } from "next";

import Review from "@/models/Review";
import { ReviewsSection } from "@/app/components/reviews/review-section";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

interface ProductPageProps {
    params: Promise<{ id: string }>;
}

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
    const { id } = await params;

    await connectToDatabase();
    const product = await Automation.findById(id).lean();

    if (!product) {
        return {
            title: 'Produit introuvable - Koda',
        };
    }

    return {
        title: `${product.title} - Koda`,
        description: product.description.slice(0, 160),
        openGraph: {
            title: product.title,
            description: product.description.slice(0, 160),
            images: product.previewImageUrl ? [getPublicImageUrl(product.previewImageUrl)] : [],
        },
    };
}

export default async function ProductPage({ params }: ProductPageProps) {
    const { id } = await params;
    const { userId } = await auth();

    await connectToDatabase();
    const product = await Automation.findById(id).lean();

    if (!product) {
        notFound();
    }

    const isOwner = userId === product.sellerId;

    // --- 1. VÉRIFICATION DE L'ACHAT (Logique existante + CanReview) ---
    let hasPurchased = false;
    let secureDownloadUrl = "#";
    let purchase = null;

    if (userId) {
        // On récupère l'achat (Attention: le champ est buyerId dans ton modèle Purchase)
        purchase = await Purchase.findOne({
            buyerId: userId,
            productId: id,
            status: 'completed' // On s'assure que le paiement est validé
        });

        if (purchase) {
            hasPurchased = true;
            try {
                const fileKey = product.fileUrl.split('.com/')[1];
                const filename = `${product.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
                secureDownloadUrl = await getDownloadUrl(fileKey, filename);
            } catch (e) {
                console.error("Erreur génération lien S3:", e);
            }
        }
    }

    // --- 2. RÉCUPÉRATION DES AVIS ---
    const reviews = await Review.find({
        productId: product._id,
        type: 'review' // On ne prend que les vrais avis notés
    })
        .sort({ createdAt: -1 })
        .lean();

    // Sérialisation pour passer les données au Client Component
    const serializedReviews = reviews.map((r: any) => ({
        ...r,
        _id: r._id.toString(),
        productId: r.productId.toString(),
        createdAt: r.createdAt.toISOString()
    }));

    // Permission de noter : Si on a acheté OU si on est le vendeur (pour tester)
    const canReview = !!purchase || isOwner;


    // --- 3. RÉCUPÉRATION VENDEUR (Logique existante) ---
    let sellerName = "Vendeur vérifié";
    let sellerImageUrl = null;

    try {
        if (product.sellerId && product.sellerId !== "mock-seller") {
            const seller = await clerkClient.users.getUser(product.sellerId);
            sellerName = seller.username || `${seller.firstName} ${seller.lastName}` || "Utilisateur Koda";
            sellerImageUrl = seller.imageUrl;
        }
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
                                    <Image
                                        src={getPublicImageUrl(product.previewImageUrl)}
                                        alt={product.title}
                                        width={1200}
                                        height={675}
                                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                                        priority
                                        unoptimized
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                        <Zap size={48} className="opacity-20" />
                                        <span className="text-sm font-medium">Aperçu de l'automatisation {product.category}</span>
                                    </div>
                                )}
                            </div>
                            <CardContent className="p-8">
                                <div className="flex items-center gap-3 mb-4 flex-wrap">
                                    <Badge variant="outline" className="capitalize text-sm">
                                        {product.category}
                                    </Badge>
                                    <Badge className="bg-primary/90 hover:bg-primary text-sm">
                                        {product.platform}
                                    </Badge>
                                    {hasPurchased && (
                                        <Badge className="bg-green-600 hover:bg-green-700 text-white gap-1">
                                            <ShieldCheck className="h-3 w-3" />
                                            Acheté
                                        </Badge>
                                    )}
                                </div>

                                <h1 className="text-4xl font-extrabold tracking-tight mb-8 italic">
                                    {product.title}
                                </h1>

                                {/* --- SYSTÈME D'ONGLETS --- */}
                                <Tabs defaultValue="description" className="w-full">
                                    <TabsList className="grid w-full grid-cols-3 mb-6">
                                        <TabsTrigger value="description">Description</TabsTrigger>
                                        <TabsTrigger value="reviews">Avis ({product.reviewCount || 0})</TabsTrigger>
                                        <TabsTrigger value="discussion">Discussion</TabsTrigger>
                                    </TabsList>

                                    {/* 1. Onglet Description */}
                                    <TabsContent value="description" className="animate-in fade-in slide-in-from-left-2 duration-300">
                                        <div className="prose prose-stone dark:prose-invert max-w-none">
                                            <h3 className="text-lg font-semibold mb-3">À propos de cette automatisation</h3>
                                            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                                {product.description}
                                            </p>
                                        </div>
                                    </TabsContent>

                                    {/* 2. Onglet Avis (Reviews) */}
                                    <TabsContent value="reviews" className="animate-in fade-in slide-in-from-right-2 duration-300">
                                        <ReviewsSection
                                            productId={product._id.toString()}
                                            reviews={serializedReviews}
                                            canReview={canReview}
                                        />
                                    </TabsContent>

                                    {/* 3. Onglet Discussion (Placeholder) */}
                                    <TabsContent value="discussion" className="animate-in fade-in slide-in-from-right-2 duration-300">
                                        <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-xl bg-muted/20">
                                            <div className="p-4 bg-background rounded-full mb-4 shadow-sm">
                                                <MessageSquare className="h-6 w-6 text-muted-foreground" />
                                            </div>
                                            <h3 className="text-lg font-semibold">Espace Discussion</h3>
                                            <p className="text-muted-foreground max-w-sm mt-2">
                                                Cet espace sera bientôt disponible pour poser vos questions au vendeur avant l'achat.
                                            </p>
                                        </div>
                                    </TabsContent>
                                </Tabs>

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
                                    ) : isOwner ? (
                                        <div className="space-y-3">
                                            <div className="w-full text-lg h-14 flex items-center justify-center bg-muted/50 rounded-lg border-2 border-primary/20 cursor-not-allowed">
                                                <Package className="mr-2 h-5 w-5 text-primary" />
                                                <span className="font-semibold text-primary">Votre produit</span>
                                            </div>
                                            <p className="text-xs text-center text-muted-foreground">
                                                Vous ne pouvez pas acheter vos propres produits
                                            </p>
                                        </div>
                                    ) : !userId ? (
                                        <Button
                                            asChild
                                            className="w-full text-lg h-14 shadow-lg shadow-primary/20"
                                            size="lg"
                                        >
                                            <Link href="/sign-in">
                                                Se connecter pour acheter
                                            </Link>
                                        </Button>
                                    ) : (
                                        <form
                                            action={async () => {
                                                "use server";
                                                const url = await createSingleProductCheckout(id);
                                                redirect(url);
                                            }}
                                        >
                                            <Button
                                                type="submit"
                                                className="w-full text-lg h-14 shadow-lg shadow-primary/20"
                                                size="lg"
                                            >
                                                <Zap className="mr-2 h-5 w-5" />
                                                Acheter maintenant
                                            </Button>
                                        </form>
                                    )}
                                </div>

                                {/* BLOC VENDEUR */}
                                <div className="pt-4 flex items-center gap-3 border-t mt-4">
                                    {sellerImageUrl ? (
                                        <img src={sellerImageUrl} alt={sellerName} className="h-10 w-10 rounded-full border" />
                                    ) : (
                                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                                            <User size={20} className="text-muted-foreground" />
                                        </div>
                                    )}
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Vendu par</span>
                                        <span className="text-sm font-semibold text-primary">{sellerName}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}