"use client";

import { useState } from "react";
import { Menu, X, LayoutDashboard, ShieldCheck, Store, Package, Tag } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/app/components/ui/sheet";
import { Link } from "@/i18n/routing";
// Link imported above
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";
import { LanguageSwitcher } from "@/app/components/layout/language-switcher";
import { ModeToggle } from "@/app/components/layout/mode-toggle";

interface MobileMenuProps {
    isAdmin: boolean;
    translations: {
        navigation: {
            catalog: string;
            sell: string;
            dashboard: string;
        };
        auth: {
            login: string;
            signup: string;
        };
    };
}

export function MobileMenu({ isAdmin, translations }: MobileMenuProps) {
    const [open, setOpen] = useState(false);

    const closeMenu = () => setOpen(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
                <SheetHeader className="p-6 border-b">
                    <SheetTitle className="text-left text-2xl font-bold tracking-tight flex items-center gap-1">
                        Koda<span className="text-3xl text-orange-500">.</span>
                    </SheetTitle>
                </SheetHeader>

                <nav className="flex flex-col p-4 gap-2">
                    <Link
                        href="/catalog"
                        onClick={closeMenu}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                        <Package className="h-5 w-5" />
                        <span className="font-medium">{translations.navigation.catalog}</span>
                    </Link>

                    <Link
                        href="/sell"
                        onClick={closeMenu}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                        <Tag className="h-5 w-5" />
                        <span className="font-medium">{translations.navigation.sell}</span>
                    </Link>

                    <SignedIn>
                        <div className="h-px bg-border my-2" />

                        <Link
                            href="/dashboard"
                            onClick={closeMenu}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                            <LayoutDashboard className="h-5 w-5" />
                            <span className="font-medium">{translations.navigation.dashboard}</span>
                        </Link>

                        {isAdmin && (
                            <Link
                                href="/admin"
                                onClick={closeMenu}
                                className="flex items-center gap-3 px-4 py-3 rounded-lg text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 hover:bg-purple-500/10 transition-colors"
                            >
                                <ShieldCheck className="h-5 w-5" />
                                <span className="font-medium">Admin</span>
                            </Link>
                        )}
                    </SignedIn>

                    <SignedOut>
                        <div className="h-px bg-border my-2" />

                        <div className="flex flex-col gap-2 px-4 pt-2">
                            <SignInButton mode="modal">
                                <Button variant="outline" className="w-full" onClick={closeMenu}>
                                    {translations.auth.login}
                                </Button>
                            </SignInButton>
                            <SignUpButton mode="modal">
                                <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white" onClick={closeMenu}>
                                    {translations.auth.signup}
                                </Button>
                            </SignUpButton>
                        </div>
                    </SignedOut>

                    {/* Language & Theme controls */}
                    <div className="h-px bg-border my-2" />
                    <div className="flex items-center justify-center gap-2 px-4 py-2">
                        <LanguageSwitcher />
                        <ModeToggle />
                    </div>
                </nav>
            </SheetContent>
        </Sheet>
    );
}
