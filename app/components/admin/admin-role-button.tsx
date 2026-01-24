"use client";

import { updateUserRole } from "@/app/actions/admin";
import { Button } from "@/app/components/ui/button";
import { Shield, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface AdminRoleButtonProps {
    userId: string;
    currentRole: string;
}

export function AdminRoleButton({ userId, currentRole }: AdminRoleButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleToggle = async () => {
        setIsLoading(true);
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        try {
            const result = await updateUserRole(userId, newRole);
            if (result.success) {
                toast.success(`Rôle mis à jour : ${newRole.toUpperCase()}`);
            }
        } catch (err: any) {
            toast.error(err.message || "Une erreur est survenue");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant="ghost"
            size="icon-sm"
            disabled={isLoading}
            onClick={handleToggle}
            title="Changer le rôle"
        >
            {currentRole === 'admin' ? (
                <UserIcon className={`h-3 w-3 ${isLoading ? 'animate-pulse' : ''}`} />
            ) : (
                <Shield className={`h-3 w-3 ${isLoading ? 'animate-pulse' : ''}`} />
            )}
        </Button>
    );
}
