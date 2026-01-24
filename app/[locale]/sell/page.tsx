import { SellForm } from "@/app/components/forms/sell-form";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import { redirect } from "next/navigation";
import { getStripeOnboardingLink } from "@/app/actions/stripe-connect";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Wallet } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Vendre une Automatisation - Koda',
    description: 'Publiez votre automatisation sur Koda et commencez à vendre vos workflows',
    robots: 'noindex, nofollow',
};

export default async function SellPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    await connectToDatabase();
    const user = await User.findOne({ clerkId: userId });

    if (!user || !user.stripeConnectId) {
        async function handleConnect() {
            "use server";
            const url = await getStripeOnboardingLink();
            redirect(url);
        }

        return (
            <div className="min-h-screen bg-slate-50/50 py-12 px-4 flex items-center justify-center">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="mx-auto bg-primary/10 p-4 rounded-full mb-4">
                            <Wallet className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle>Configuration Requise</CardTitle>
                        <CardDescription>
                            Pour vendre sur Koda, vous devez connecter un compte Stripe pour recevoir vos paiements.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form action={handleConnect}>
                            <Button className="w-full" size="lg">
                                Configurer mes paiements
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 py-12 px-4">
            <div className="container mx-auto space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Vendre un Blueprint</h1>
                    <p className="text-muted-foreground max-w-lg mx-auto">
                        Partagez votre expertise et générez des revenus passifs.
                    </p>
                </div>
                <SellForm />
            </div>
        </div>
    );
}