import { auth, currentUser } from "@clerk/nextjs/server";
import User from "@/models/User";
import { getSellerBalance, getSalesHistory, getMyProducts, getMyOrders } from "@/app/actions/dashboard";
import { getMyFavorites } from "@/app/actions/favorites";
import { deleteProduct } from "@/app/actions/product-management";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DashboardContent } from "./DashboardContent";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('Dashboard');
    return {
        title: `${t('title')} - Koda`,
        description: t('description'),
        robots: 'noindex, nofollow',
    };
}

type DashboardMode = 'buyer' | 'seller' | 'messages';

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) redirect("/sign-in");

    const resolvedParams = await searchParams;
    const mode = resolvedParams.mode;
    const validModes: DashboardMode[] = ['buyer', 'seller', 'messages'];
    const initialMode: DashboardMode = validModes.includes(mode as DashboardMode) ? (mode as DashboardMode) : 'buyer';

    // Parallel data fetching
    const [balance, sales, products, orders, favorites, dbUser] = await Promise.all([
        getSellerBalance(),
        getSalesHistory(),
        getMyProducts(),
        getMyOrders(),
        getMyFavorites(),
        User.findOne({ clerkId: userId }).lean(),
    ]);

    async function handleDelete(productId: string) {
        "use server";
        await deleteProduct(productId);
    }

    // Merge Clerk data with DB data
    const completeUser = {
        clerkId: userId,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
        email: user.emailAddresses[0]?.emailAddress,
        username: dbUser?.username || user.username,
        bio: dbUser?.bio || "",
        createdAt: user.createdAt,
        onboardingComplete: dbUser?.onboardingComplete || false
    };

    return (
        <DashboardContent
            user={completeUser}
            balance={balance}
            sales={sales}
            products={products}
            orders={orders}
            favorites={favorites}
            onDelete={handleDelete}
            initialMode={initialMode}
        />
    );
}