"use client";

import { Button } from "@/app/components/ui/button";

export default function SentryTestPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
            <h1 className="text-2xl font-bold">Test Sentry</h1>
            <p>Cliquez sur le bouton ci-dessous pour déclencher une erreur de test.</p>

            <Button
                variant="destructive"
                onClick={() => {
                    throw new Error("Sentry Test Error: Front-end (Client)");
                }}
            >
                Déclencher erreur Client
            </Button>
        </div>
    );
}
