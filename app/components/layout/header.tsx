import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { LayoutDashboard } from "lucide-react";
import CartSheet from '@/app/components/cart/cart-sheet';

export default function Header() {
    return (
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                {/* Logo */}
                <Link href="/" className="text-xl font-bold tracking-tight">
                    Koda.
                </Link>

                {/* Navigation & Auth */}
                <div className="flex items-center gap-4">
                    <nav className="hidden md:flex gap-6 text-sm font-medium items-center">
                        <Link href="/products" className="transition-colors hover:text-primary">
                            Catalogue
                        </Link>

                        <SignedIn>
                            <Link href="/dashboard" className="transition-colors hover:text-primary flex items-center gap-1">
                                <LayoutDashboard className="h-4 w-4" />
                                Dashboard
                            </Link>
                        </SignedIn>

                        <Link href="/sell" className="transition-colors hover:text-primary">
                            Vendre
                        </Link>
                    </nav>

                    <div className="flex items-center gap-2">

                        <CartSheet /> {/*Panier*/}

                        <SignedOut>
                            <SignInButton mode="modal">
                                <Button variant="ghost">Connexion</Button>
                            </SignInButton>
                            <SignUpButton mode="modal">
                                <Button>S'inscrire</Button>
                            </SignUpButton>
                        </SignedOut>

                        <SignedIn>
                            <UserButton afterSignOutUrl="/" />
                        </SignedIn>
                    </div>
                </div>
            </div>
        </header>
    );
}