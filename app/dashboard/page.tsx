import { auth } from "@clerk/nextjs/server";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { getStripeOnboardingLink } from "@/app/actions/stripe-connect";
import { redirect } from "next/navigation";
import { Wallet, TrendingUp } from "lucide-react";

export default async function DashboardPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    async function handleConnect() {
        "use server";
        const url = await getStripeOnboardingLink();
        redirect(url);
    }

    return (
        <div className="container mx-auto py-10 px-4">
            <h1 className="text-3xl font-bold mb-8 text-primary italic">Mon Dashboard Vendeur</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Balance Stripe</CardTitle>
                        <Wallet className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground mb-4">
                            Gérez vos revenus et vos virements bancaires via Stripe.
                        </p>
                        <form action={handleConnect}>
                            <Button className="w-full">
                                Configurer mes paiements
                            </Button>
                        </form>
                    </CardContent>
                </Card>

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
        </div>
    );
}