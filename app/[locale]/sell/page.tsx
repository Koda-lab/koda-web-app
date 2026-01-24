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
            <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
                    <div className="w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] opacity-50 animate-pulse" />
                </div>

                <Card className="w-full max-w-md text-center relative z-10 border-border/50 shadow-2xl bg-card/50 backdrop-blur-md">
                    <CardHeader className="space-y-4 pb-2">
                        <div className="mx-auto bg-primary/10 p-5 rounded-full mb-2 ring-1 ring-primary/20">
                            <Wallet className="h-10 w-10 text-primary" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Configuration Requise</CardTitle>
                        <CardDescription className="text-base">
                            Pour vendre sur Koda, vous devez connecter un compte Stripe pour recevoir vos paiements de manière sécurisée.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form action={handleConnect}>
                            <Button className="w-full text-lg h-12 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]" size="lg">
                                Configurer mes paiements
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground relative">
            {/* Subtle Gradient Background */}
            <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none -z-10" />

            <div className="container mx-auto px-4 py-16 space-y-12 max-w-4xl">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center px-3 py-1 text-xs font-medium text-primary rounded-full bg-primary/10 mb-2">
                        Espace Vendeur
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
                        Vendre un Blueprint
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
                        Partagez votre expertise, aidez la communauté et générez des revenus passifs avec vos automatisations.
                    </p>
                </div>

                <div className="relative z-10">
                    <SellForm />
                </div>
            </div>
        </div>
    );
}