"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service like Sentry
        console.error(error);
    }, [error]);

    return (
        <div className="flex h-[80vh] flex-col items-center justify-center space-y-4 text-center px-4">
            <div className="bg-red-100 p-6 rounded-full dark:bg-red-900/20">
                <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-red-600 dark:text-red-400">
                Une erreur est survenue !
            </h2>
            <p className="text-muted-foreground max-w-[500px]">
                Désolé, quelque chose s'est mal passé de notre côté.
                Nous avons été notifiés du problème.
            </p>
            <div className="flex gap-4 mt-4">
                <Button onClick={() => window.location.href = '/'} variant="outline">
                    Retour à l'accueil
                </Button>
                <Button onClick={() => reset()}>Réessayer</Button>
            </div>
        </div>
    );
}
