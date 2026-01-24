"use client";

import { toggleBanUser } from "@/app/actions/admin";
import { ConfirmButton } from "@/app/components/ui/confirm-button";
import { UserX, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface AdminBanButtonProps {
    userId: string;
    isBanned: boolean;
}

export function AdminBanButton({ userId, isBanned }: AdminBanButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleToggle = async () => {
        setIsLoading(true);
        try {
            const result = await toggleBanUser(userId);
            if (result.success) {
                toast.success(result.isBanned ? "Utilisateur banni avec succès" : "Utilisateur débanni avec succès");
            }
        } catch (err: any) {
            toast.error(err.message || "Une erreur est survenue");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ConfirmButton
            variant={isBanned ? "outline" : "destructive"}
            size="sm"
            className="flex items-center gap-1"
            disabled={isLoading}
            confirmMessage={isBanned ? "Voulez-vous débannir cet utilisateur ?" : "Voulez-vous vraiment bannir cet utilisateur ?"}
            onClick={handleToggle}
        >
            {isBanned ? (
                <>
                    <UserCheck className="h-3 w-3" />
                    Débannir
                </>
            ) : (
                <>
                    <UserX className="h-3 w-3" />
                    Bannir
                </>
            )}
        </ConfirmButton>
    );
}
