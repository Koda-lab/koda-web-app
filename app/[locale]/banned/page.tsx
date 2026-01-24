import { Button } from "@/app/components/ui/button";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function BannedPage() {
    const t = await getTranslations('Auth');

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-6">
            <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full">
                <ShieldAlert className="h-16 w-16 text-red-600 dark:text-red-400" />
            </div>

            <h1 className="text-4xl font-bold tracking-tight">Compte Suspendu</h1>

            <p className="max-w-md text-gray-500 text-lg">
                Votre compte a été suspendu par un administrateur pour violation des conditions d'utilisation ou activité suspecte.
            </p>

            <div className="bg-gray-50 dark:bg-gray-900 border rounded-lg p-4 text-sm text-left max-w-md">
                <p className="font-semibold mb-1">Que faire ?</p>
                <ul className="list-disc list-inside space-y-1">
                    <li>Contactez le support si vous pensez qu'il s'agit d'une erreur.</li>
                    <li>Vérifiez vos e-mails pour plus de détails sur cette décision.</li>
                </ul>
            </div>

            <Button asChild variant="outline" className="mt-4">
                <Link href="/">
                    Retour à l'accueil
                </Link>
            </Button>
        </div>
    );
}
