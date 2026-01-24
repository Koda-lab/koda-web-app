import { requireAdmin } from "@/lib/auth-utils";
import Link from "next/link";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Protect the entire admin section
    await requireAdmin();

    return (
        <div className="flex min-h-screen">
            <aside className="w-64 bg-gray-100 dark:bg-gray-900 border-r p-6 hidden md:block">
                <h2 className="text-xl font-bold mb-6">Admin Koda</h2>
                <nav className="space-y-2">
                    <Link href="/admin" className="block p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800">
                        Utilisateurs
                    </Link>
                    <Link href="/admin/sales" className="block p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800 opacity-50 cursor-not-allowed">
                        Ventes (Bientôt)
                    </Link>
                    <Link href="/" className="block p-2 mt-8 text-blue-600 hover:underline">
                        &larr; Retour au site
                    </Link>
                </nav>
            </aside>
            <main className="flex-1 p-8">
                {children}
            </main>
        </div>
    );
}
