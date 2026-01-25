import { getAllUsers, getAllProducts } from "@/app/actions/admin";
import { AdminRestoreButton } from "@/app/components/admin/admin-restore-button";
import { AdminTabs } from "@/app/components/admin/admin-tabs";
import { getTranslations, getFormatter } from "next-intl/server";

export default async function AdminDashboard() {
    const [users, products, t, format] = await Promise.all([
        getAllUsers(),
        getAllProducts(),
        getTranslations('Admin'),
        getFormatter()
    ]);

    // Préparation des traductions pour le client
    const translations = {
        tabs: {
            users: t('tabs.users'),
            products: t('tabs.products')
        },
        usersTable: {
            user: t('usersTable.user'),
            email: t('usersTable.email'),
            role: t('usersTable.role'),
            date: t('usersTable.date'),
            actions: t('usersTable.actions'),
            noName: t('usersTable.noName'),
            missingEmail: t('usersTable.missingEmail'),
            seller: t('usersTable.seller'),
            banned: t('usersTable.banned')
        },
        productsTable: {
            product: t('productsTable.product'),
            seller: t('productsTable.seller'),
            price: t('productsTable.price'),
            status: t('productsTable.status'),
            actions: t('productsTable.actions'),
            certified: t('productsTable.certified'),
            unverified: t('productsTable.unverified'),
            test: t('productsTable.test'),
            decertify: t('productsTable.decertify'),
            certify: t('productsTable.certify'),
            noProducts: t('productsTable.noProducts')
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-3xl font-bold italic tracking-tight">{t('title')}</h1>
                <AdminRestoreButton />
            </div>

            <AdminTabs
                users={users}
                products={products}
                translations={translations}
            />
        </div>
    );
}
