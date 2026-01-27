import { auth, currentUser } from "@clerk/nextjs/server";
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

export default async function DashboardPage() {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) redirect("/sign-in");

    // Parallel data fetching
    const [balance, sales, products, orders, favorites] = await Promise.all([
        getSellerBalance(),
        getSalesHistory(),
        getMyProducts(),
        getMyOrders(),
        getMyFavorites(),
    ]);

    async function handleDelete(productId: string) {
        "use server";
        await deleteProduct(productId);
    }

    return (
        <DashboardContent
            user={{
                firstName: user.firstName,
                lastName: user.lastName,
                imageUrl: user.imageUrl,
                createdAt: user.createdAt,
                email: user.emailAddresses[0]?.emailAddress
            }}
            balance={balance}
            sales={sales}
            products={products}
            orders={orders}
            favorites={favorites}
            onDelete={handleDelete}
        />
    );
}