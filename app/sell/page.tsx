import { SellForm } from "@/app/components/forms/sell-form";

export default function SellPage() {
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