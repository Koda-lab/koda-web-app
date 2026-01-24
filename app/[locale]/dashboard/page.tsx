import { auth, currentUser } from "@clerk/nextjs/server";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { getStripeOnboardingLink, getStripeLoginLink } from "@/app/actions/stripe-connect";
import { getSellerBalance, getSalesHistory, getMyProducts } from "@/app/actions/dashboard";
import { redirect } from "next/navigation";
import { Wallet, TrendingUp, User, Package, Edit, Trash2, Plus } from "lucide-react";
import Link from "next/link";
import { deleteProduct } from "@/app/actions/product-management";
import { getMyOrders } from "@/app/actions/dashboard";
import { Download, ShoppingBag } from "lucide-react";
import { getPublicImageUrl } from "@/lib/image-helper";
import Image from "next/image";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Dashboard - Koda',
    description: 'Gérez vos produits, consultez vos ventes et vos achats sur Koda',
    robots: 'noindex, nofollow', // Dashboard privé
};

export default async function DashboardPage() {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) redirect("/sign-in");

    // Récupération des données parallèles
    const [balance, sales, products, orders] = await Promise.all([
        getSellerBalance(),
        getSalesHistory(),
        getMyProducts(),
        getMyOrders(),
    ]);

    async function handleConnect() {
        "use server";
        const url = await getStripeOnboardingLink();
        redirect(url);
    }

    async function handleStripeDashboard() {
        "use server";
        const url = await getStripeLoginLink();
        redirect(url);
    }

    async function handleDelete(productId: string) {
        "use server";
        await deleteProduct(productId);
    }

    return (
        <div className="container mx-auto py-10 px-4 min-h-screen">
            <h1 className="text-3xl font-bold mb-8 text-primary italic">Mon Dashboard</h1>

            <Tabs defaultValue="account" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 max-w-2xl">
                    <TabsTrigger value="account">Compte</TabsTrigger>
                    <TabsTrigger value="orders">Mes Commandes</TabsTrigger>
                    <TabsTrigger value="payments">Ventes</TabsTrigger>
                    <TabsTrigger value="products">Produits</TabsTrigger>
                </TabsList>

                {/* --- SECTION COMPTE --- */}
                <TabsContent value="account" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informations Personnelles</CardTitle>
                            <CardDescription>Gérez vos informations de profil via Clerk.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center gap-6">
                            <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-primary/20">
                                <img src={user.imageUrl} alt="Profile" className="object-cover w-full h-full" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-semibold">{user.firstName} {user.lastName}</h3>
                                <p className="text-muted-foreground">{user.emailAddresses[0].emailAddress}</p>
                                <p className="text-sm text-primary font-medium mt-2">
                                    Membre depuis le {new Date(user.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- SECTION COMMANDES (ACHATS) --- */}
                <TabsContent value="orders" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Mes Achats</CardTitle>
                            <CardDescription>Retrouvez ici tous les produits que vous avez achetés.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {orders.length > 0 ? (
                                <div className="space-y-4">
                                    {orders.map((order) => (
                                        <div key={order._id} className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 bg-muted rounded overflow-hidden">
                                                    {order.productId && order.productId.previewImageUrl ? (
                                                        <img src={order.productId.previewImageUrl} alt={order.productId.title || "Produit"} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <ShoppingBag className="h-full w-full p-2 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-lg">{order.productId ? order.productId.title : "Produit Indisponible"}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Acheté le {new Date(order.createdAt).toLocaleDateString()} for {order.amount.toFixed(2)} €
                                                    </p>
                                                </div>
                                            </div>

                                            {order.productId && (
                                                <Button asChild variant="outline" size="sm">
                                                    <Link href={`/product/${order.productId._id}`}>
                                                        <Download className="mr-2 h-4 w-4" />
                                                        Accéder au produit
                                                    </Link>
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <p className="text-muted-foreground mb-4">Vous n'avez pas encore effectué d'achats.</p>
                                    <Button asChild>
                                        <Link href="/">Explorer le catalogue</Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- SECTION PAIEMENTS --- */}
                <TabsContent value="payments" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Carte Balance */}
                        <Card className="border-primary/20 bg-primary/5">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Balance Stripe</CardTitle>
                                <Wallet className="h-4 w-4 text-primary" />
                            </CardHeader>
                            <CardContent>
                                {balance ? (
                                    <>
                                        <div className="text-2xl font-bold">{balance.available.toFixed(2)} {balance.currency}</div>
                                        <p className="text-xs text-muted-foreground mb-4">
                                            En attente : {balance.pending.toFixed(2)} {balance.currency}
                                        </p>
                                        <form action={handleStripeDashboard}>
                                            <Button variant="outline" size="sm" type="submit" className="w-full">
                                                Voir mon Dashboard Stripe
                                            </Button>
                                        </form>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-xs text-muted-foreground mb-4">
                                            Vous devez configurer vos paiements pour recevoir des fonds.
                                        </p>
                                        <form action={handleConnect}>
                                            <Button className="w-full">Configurer mes paiements</Button>
                                        </form>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Carte Commission */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Commission Plateforme</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">15%</div>
                                <p className="text-xs text-muted-foreground">Frais de service Koda par vente.</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Historique des ventes */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Historique des ventes</CardTitle>
                            <CardDescription>Vos dernières transactions réussies.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {sales.length > 0 ? (
                                <div className="space-y-4">
                                    {sales.map((sale) => (
                                        <div key={sale._id} className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0">
                                            <div>
                                                <p className="font-medium">{sale.productId.title}</p>
                                                <p className="text-xs text-muted-foreground">{new Date(sale.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <div className="font-bold text-green-600">
                                                +{sale.amount.toFixed(2)} €
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-sm">Aucune vente pour le moment.</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- SECTION MES PRODUITS --- */}
                <TabsContent value="products" className="space-y-6">
                    <div className="flex justify-between items-center bg-muted/20 p-4 rounded-xl">
                        <h2 className="text-xl font-semibold">Mes Produits</h2>
                        <Button asChild>
                            <Link href="/sell">
                                <Plus className="mr-2 h-4 w-4" />
                                Nouveau Produit
                            </Link>
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products.length > 0 ? (
                            products.map((product) => (
                                <Card key={product._id} className="overflow-hidden group flex flex-col h-full hover:shadow-lg transition-shadow duration-200">
                                    <div className="aspect-video bg-muted relative w-full overflow-hidden">
                                        {product.previewImageUrl ? (
                                            <Image
                                                src={getPublicImageUrl(product.previewImageUrl)}
                                                alt={product.title}
                                                fill
                                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                                unoptimized
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center w-full h-full text-muted-foreground bg-muted/50">
                                                <Package className="h-12 w-12 opacity-20 mb-2" />
                                                <span className="text-xs text-muted-foreground/50 font-medium">Aucune image</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-5 flex flex-col flex-1">
                                        <div className="flex justify-between items-start gap-4 mb-2">
                                            <h3 className="font-semibold text-base line-clamp-2 leading-tight" title={product.title}>{product.title}</h3>
                                            <div className="text-lg font-bold text-primary whitespace-nowrap">{product.price.toFixed(2)} €</div>
                                        </div>

                                        <div className="mt-auto pt-4 flex gap-2">
                                            <Button variant="outline" size="default" className="flex-1 bg-background hover:bg-muted" asChild>
                                                <Link href={`/dashboard/edit/${product._id}`}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Modifier
                                                </Link>
                                            </Button>

                                            <form action={handleDelete.bind(null, product._id)}>
                                                <Button variant="destructive" size="icon" type="submit" title="Supprimer le produit">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </form>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-10">
                                <p className="text-muted-foreground mb-4">Vous n'avez pas encore mis de produits en ligne.</p>
                                <Button asChild variant="outline">
                                    <Link href="/sell">Commencer à vendre</Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div >
    );
}