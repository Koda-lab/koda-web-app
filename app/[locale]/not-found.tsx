import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { Ghost } from "lucide-react";

export default function NotFound() {
    return (
        <div className="flex h-[80vh] flex-col items-center justify-center space-y-4 text-center px-4">
            <div className="bg-muted p-6 rounded-full">
                <Ghost className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">404 - Page Non Trouvée</h2>
            <p className="text-muted-foreground max-w-[500px]">
                Oups ! La page que vous cherchez semble avoir disparu dans le cloud.
                Elle a peut-être été déplacée ou supprimée.
            </p>
            <Button asChild size="lg" className="mt-4">
                <Link href="/">Retour à l'accueil</Link>
            </Button>
        </div>
    );
}
