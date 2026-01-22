import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import Stripe from "stripe";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { CheckCircle, Loader2 } from "lucide-react";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function StripeReturnPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    await connectToDatabase();
    const user = await User.findOne({ clerkId: userId });

    if (!user || !user.stripeConnectId) {
        redirect("/dashboard");
    }

    // Fetch the actual Stripe account status
    try {
        const account = await stripe.accounts.retrieve(user.stripeConnectId);

        // Check if onboarding is complete
        if (account.details_submitted && account.charges_enabled) {
            // Update the database
            await User.findOneAndUpdate(
                { clerkId: userId },
                {
                    stripeConnectId: account.id,
                    onboardingComplete: true
                }
            );

            // Redirect to sell page now that they're set up
            redirect("/sell");
        } else {
            // Onboarding not complete, redirect back to dashboard
            redirect("/dashboard?stripe_incomplete=true");
        }
    } catch (error) {
        console.error("Error checking Stripe account:", error);
        redirect("/dashboard?stripe_error=true");
    }

    // This should never render, but just in case:
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Vérification de votre compte...
                    </CardTitle>
                    <CardDescription>
                        Un instant pendant que nous vérifions votre configuration Stripe.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Vous allez être redirigé automatiquement.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
