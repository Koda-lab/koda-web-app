import { Link } from '@/i18n/routing';
import { Button } from '@/app/components/ui/button';
import { SignInButton, SignUpButton, SignedIn, SignedOut } from '@clerk/nextjs';
import { LayoutDashboard, ShieldCheck } from "lucide-react";
import CartSheetWrapper from '@/app/components/cart/cart-sheet-wrapper';
import FavoritesSheetWrapper from '@/app/components/favorites/favorites-sheet-wrapper';
import UserButtonWrapper from '@/app/components/auth/user-button-wrapper';
import { getTranslations } from 'next-intl/server';
import { ModeToggle } from '@/app/components/layout/mode-toggle';
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/app/components/layout/language-switcher";
import { MobileMenu } from "@/app/components/layout/mobile-menu";
import NotificationBell from "@/app/components/dashboard/NotificationBell";

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
        <header className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4">
            <div className={cn(
                // Shape & Size
                "w-full max-w-7xl h-16 px-6 rounded-2xl flex items-center justify-between",

                // Glassmorphism
                "backdrop-blur-md shadow-lg transition-all duration-300",

                // Light Mode: White/Translucent + Gray Border
                "bg-white/70 border border-gray-200/60",

                // Dark Mode: Dark/Translucent + Orange Accent
                "dark:bg-neutral-950/60 dark:border-orange-500/30 dark:shadow-orange-900/10"
            )}>
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <MobileMenu
                        isAdmin={isAdmin}
                        translations={{
                            navigation: {
                                catalog: t('catalog'),
                                sell: t('sell'),
                                dashboard: t('dashboard')
                            },
                            auth: {
                                login: tAuth('login'),
                                signup: tAuth('signup')
                            }
                        }}
                    />
                    <Link href="/" className="text-2xl font-bold tracking-tight flex items-center gap-1">
                        Koda<span className="text-3xl text-orange-500">.</span>
                    </Link>
                </div>

                {/* Navigation & Auth */}
                <div className="flex items-center gap-2 sm:gap-4">
                    <nav className="hidden md:flex gap-6 text-sm font-medium items-center">
                        <Link href="/catalog" className="transition-colors hover:text-primary text-muted-foreground hover:text-foreground">
                            {t('catalog')}
                        </Link>

                        <SignedIn>
                            <Link href="/dashboard" className="transition-colors hover:text-primary text-muted-foreground hover:text-foreground flex items-center gap-1">
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

                        <Link href="/sell" className="transition-colors hover:text-primary text-muted-foreground hover:text-foreground">
                            {t('sell')}
                        </Link>
                    </nav>

                    <div className="flex items-center gap-1 sm:gap-2">
                        <FavoritesSheetWrapper /> {/*Favoris*/}
                        <CartSheetWrapper /> {/*Panier*/}
                        <div className="hidden sm:block">
                            <LanguageSwitcher />
                        </div>
                        <div className="hidden sm:block">
                            <ModeToggle />
                        </div>

                        <div className="h-6 w-px bg-border/50 mx-1 hidden sm:block" />

                        <SignedOut>
                            <div className="hidden md:flex items-center gap-2">
                                <SignInButton mode="modal">
                                    <Button variant="ghost" size="sm">{tAuth('login')}</Button>
                                </SignInButton>
                                <SignUpButton mode="modal">
                                    <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-6">{tAuth('signup')}</Button>
                                </SignUpButton>
                            </div>
                        </SignedOut>

                        <SignedIn>
                            <NotificationBell />
                            <UserButtonWrapper />
                        </SignedIn>
                    </div>
                </div>
            </div>
        </header>
    );
}