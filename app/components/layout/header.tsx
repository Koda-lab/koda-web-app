import { Link } from '@/i18n/routing';
import { Button } from '@/app/components/ui/button';
import { SignInButton, SignUpButton, SignedIn, SignedOut } from '@clerk/nextjs';
import { LayoutDashboard, ShieldCheck } from "lucide-react";
import CartSheetWrapper from '@/app/components/cart/cart-sheet-wrapper';
import UserButtonWrapper from '@/app/components/auth/user-button-wrapper';
import { getTranslations } from 'next-intl/server';
import { ModeToggle } from '@/app/components/layout/mode-toggle';
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';

export default async function Header() {
    const t = await getTranslations('Navigation');
    const tAuth = await getTranslations('Auth');
    const { userId } = await auth();

    let isAdmin = false;
    if (userId) {
        await connectToDatabase();
        const user = await User.findOne({ clerkId: userId }, 'role');
        if (user && user.role === 'admin') {
            isAdmin = true;
        }
    }

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

                            {isAdmin && (
                                <Link href="/admin" className="transition-colors text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 flex items-center gap-1 font-semibold">
                                    <ShieldCheck className="h-4 w-4" />
                                    Admin
                                </Link>
                            )}
                        </SignedIn>

                        <Link href="/sell" className="transition-colors hover:text-primary">
                            {t('sell')}
                        </Link>
                    </nav>

                    <div className="flex items-center gap-2">

                        <CartSheetWrapper /> {/*Panier*/}
                        <ModeToggle />
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