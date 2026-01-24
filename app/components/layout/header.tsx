import { Link } from '@/i18n/routing';
import { Button } from '@/app/components/ui/button';
import { SignInButton, SignUpButton, SignedIn, SignedOut } from '@clerk/nextjs';
import { LayoutDashboard } from "lucide-react";
import CartSheetWrapper from '@/app/components/cart/cart-sheet-wrapper';
import UserButtonWrapper from '@/app/components/auth/user-button-wrapper';
import { useTranslations } from 'next-intl';

export default function Header() {
    const t = useTranslations('Navigation');
    const tAuth = useTranslations('Auth');

    return (
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                {/* Logo */}
                <Link href="/" className="text-3xl font-bold tracking-tight">
                    Koda<span className="text-4xl text-orange-500">.</span>
                </Link>

                {/* Navigation & Auth */}
                <div className="flex items-center gap-4">
                    <nav className="hidden md:flex gap-6 text-sm font-medium items-center">
                        <Link href="/catalog" className="transition-colors hover:text-primary">
                            {t('catalog')}
                        </Link>

                        <SignedIn>
                            <Link href="/dashboard" className="transition-colors hover:text-primary flex items-center gap-1">
                                <LayoutDashboard className="h-4 w-4" />
                                {t('dashboard')}
                            </Link>
                        </SignedIn>

                        <Link href="/sell" className="transition-colors hover:text-primary">
                            {t('sell')}
                        </Link>
                    </nav>

                    <div className="flex items-center gap-2">

                        <CartSheetWrapper /> {/*Panier*/}

                        <SignedOut>
                            <SignInButton mode="modal">
                                <Button variant="ghost">{tAuth('login')}</Button>
                            </SignInButton>
                            <SignUpButton mode="modal">
                                <Button>{tAuth('signup')}</Button>
                            </SignUpButton>
                        </SignedOut>

                        <SignedIn>
                            <UserButtonWrapper />
                        </SignedIn>
                    </div>
                </div>
            </div>
        </header>
    );
}