"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { getStripeLoginLink, getStripeOnboardingLink } from "@/app/actions/stripe-connect";
import { useLocalizedToast } from "@/hooks/use-localized-toast";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

export function StripeDashboardButton({ className }: { className?: string }) {
    const [isLoading, setIsLoading] = useState(false);
    const { showError } = useLocalizedToast();
    const t = useTranslations('Dashboard.stats');

    const handleClick = async () => {
        setIsLoading(true);
        try {
            const url = await getStripeLoginLink();
            window.open(url, "_blank", "noopener,noreferrer");
        } catch (error) {
            showError(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant="outline"
            size="default"
            onClick={handleClick}
            disabled={isLoading}
            className={`w-full rounded-xl border-primary/20 hover:bg-primary/5 transition-all text-sm font-bold ${className}`}
        >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" /> : null}
            {t('openStripe')}
        </Button>
    );
}


import { forceStripeSync } from "@/app/actions/stripe-connect"; // Added import

// ... (StripeDashboardButton remains unchanged)

export function StripeOnboardingButton({ className }: { className?: string }) {
    const [isLoading, setIsLoading] = useState(false);
    const { showError, showSuccess } = useLocalizedToast();
    const t = useTranslations('Dashboard.stats');

    const handleClick = async () => {
        setIsLoading(true);
        try {
            const url = await getStripeOnboardingLink();
            window.open(url, "_blank", "noopener,noreferrer");
        } catch (error) {
            showError(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSync = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsLoading(true);
        try {
            const res = await forceStripeSync();
            if (res.success) {
                if (res.isComplete) {
                    showSuccess("stripeVerified");
                    window.location.reload(); // Refresh to update UI state
                } else {
                    showSuccess("stripeStatusUpdated");
                }
            } else {
                if (res.error) throw new Error(res.error);
            }
        } catch (error) {
            showError(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-2 w-full">
            <Button
                onClick={handleClick}
                disabled={isLoading}
                className={`w-full rounded-xl shadow-lg shadow-primary/20 h-11 text-sm font-bold ${className}`}
            >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t('setupPayouts')}
            </Button>
            <button
                onClick={handleSync}
                disabled={isLoading}
                className="text-xs text-muted-foreground hover:text-primary underline transition-colors"
            >
                Updated settings? Click to refresh status
            </button>
        </div>
    );
}
