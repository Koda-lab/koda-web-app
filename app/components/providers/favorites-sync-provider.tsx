"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useFavorites } from "@/hooks/use-favorites";
import { getFavoriteIds } from "@/app/actions/favorites";

interface FavoritesSyncProviderProps {
    children: React.ReactNode;
}

/**
 * Syncs the favorites Zustand store with the database on mount.
 * Wraps the app to ensure favorites are loaded when user is authenticated.
 */
export function FavoritesSyncProvider({ children }: FavoritesSyncProviderProps) {
    const { userId, isLoaded } = useAuth();
    const { setFavorites, setLoading } = useFavorites();

    useEffect(() => {
        async function syncFavorites() {
            if (!isLoaded) return;

            if (!userId) {
                // Clear favorites when signed out
                setFavorites([]);
                return;
            }

            setLoading(true);
            try {
                const ids = await getFavoriteIds();
                setFavorites(ids);
            } catch (error) {
                console.error("Failed to sync favorites:", error);
            } finally {
                setLoading(false);
            }
        }

        syncFavorites();
    }, [userId, isLoaded, setFavorites, setLoading]);

    return <>{children}</>;
}
