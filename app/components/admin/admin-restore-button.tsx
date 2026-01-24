"use client";

import { restoreAllUsersFromClerk } from "@/app/actions/admin";
import { ConfirmButton } from "@/app/components/ui/confirm-button";
import { RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export function AdminRestoreButton() {
    const [isPending, setIsPending] = useState(false);

    const handleRestore = async () => {
        setIsPending(true);
        const promise = restoreAllUsersFromClerk();

        toast.promise(promise, {
            loading: 'Synchronisation avec Clerk en cours...',
            success: (data) => `Synchronisation terminée ! ${data.count} utilisateurs synchronisés.`,
            error: 'Erreur lors de la synchronisation.',
        });

        try {
            await promise;
        } catch (err) {
            console.error(err);
        } finally {
            setIsPending(false);
        }
    };

    return (
        <ConfirmButton
            variant="outline"
            className="flex items-center gap-2"
            confirmMessage="Voulez-vous synchroniser tous les utilisateurs depuis Clerk ? Cela créera les comptes manquants localement."
            onClick={handleRestore}
            disabled={isPending}
        >
            <RefreshCcw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
            Synchroniser / Restaurer Clerk
        </ConfirmButton>
    );
}
