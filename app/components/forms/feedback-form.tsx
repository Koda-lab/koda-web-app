"use client";

import { useActionState } from "react"; // Hook React 19 (Next.js 15+)
import { sendFeedbackAction } from "@/app/actions/feedback";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

export function FeedbackForm() {
    const t = useTranslations('Feedback');
    const searchParams = useSearchParams();
    const defaultType = searchParams.get("type") || "contact"; // Récupère ?type=bug depuis l'URL

    const [state, action, isPending] = useActionState(sendFeedbackAction, { success: false });

    // Effet pour afficher les toasts
    useEffect(() => {
        if (state.success) {
            toast.success(state.message);
        } else if (state.message) {
            toast.error(state.message);
        }
    }, [state]);

    if (state.success) {
        return (
            <Card className="w-full max-w-md mx-auto text-center py-12 border-dashed">
                <CardContent className="space-y-4">
                    <div className="flex justify-center">
                        <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-500" />
                        </div>
                    </div>
                    <h3 className="text-xl font-semibold">{t('success.title')}</h3>
                    <p className="text-muted-foreground">
                        {t('success.message')}
                    </p>
                    <Button variant="outline" onClick={() => window.history.back()}>
                        {t('success.back')}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-lg mx-auto shadow-lg border-muted/60">
            <CardHeader>
                <CardTitle>{t('form.title')}</CardTitle>
                <CardDescription>
                    {t('form.description')}
                </CardDescription>
            </CardHeader>

            <CardContent>
                <form action={action} className="space-y-6">

                    {/* Sélection du Type */}
                    <div className="space-y-2">
                        <Label>{t('form.typeLabel')}</Label>
                        <Select name="type" defaultValue={defaultType}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('form.typePlaceholder')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="bug">{t('form.types.bug')}</SelectItem>
                                <SelectItem value="feature">{t('form.types.feature')}</SelectItem>
                                <SelectItem value="contact">{t('form.types.contact')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <Label htmlFor="email">{t('form.emailLabel')}</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder={t('form.emailPlaceholder')}
                            required
                        />
                        {state.errors?.email && (
                            <p className="text-sm text-destructive flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> {state.errors.email[0]}
                            </p>
                        )}
                    </div>

                    {/* Sujet */}
                    <div className="space-y-2">
                        <Label htmlFor="subject">{t('form.subjectLabel')}</Label>
                        <Input
                            id="subject"
                            name="subject"
                            placeholder={t('form.subjectPlaceholder')}
                            required
                        />
                        {state.errors?.subject && (
                            <p className="text-sm text-destructive">{state.errors.subject[0]}</p>
                        )}
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                        <Label htmlFor="message">{t('form.messageLabel')}</Label>
                        <Textarea
                            id="message"
                            name="message"
                            placeholder={t('form.messagePlaceholder')}
                            className="min-h-[120px] resize-none"
                            required
                        />
                        {state.errors?.message && (
                            <p className="text-sm text-destructive">{state.errors.message[0]}</p>
                        )}
                    </div>

                    <Button type="submit" className="w-full gap-2" disabled={isPending}>
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {t('form.sending')}
                            </>
                        ) : (
                            <>
                                <Send className="h-4 w-4" />
                                {t('form.submit')}
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}