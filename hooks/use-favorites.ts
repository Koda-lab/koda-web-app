// hooks/use-favorites.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface FavoritesStore {
    favoriteIds: string[];
    isLoading: boolean;
    setFavorites: (ids: string[]) => void;
    addFavorite: (id: string) => void;
    removeFavorite: (id: string) => void;
    toggleFavorite: (id: string) => void;
    isFavorited: (id: string) => boolean;
    setLoading: (loading: boolean) => void;
}

export const useFavorites = create(
    persist<FavoritesStore>(
        (set, get) => ({
            favoriteIds: [],
            isLoading: false,
            setFavorites: (ids: string[]) => set({ favoriteIds: ids }),
            addFavorite: (id: string) => {
                const current = get().favoriteIds;
                if (!current.includes(id)) {
                    set({ favoriteIds: [...current, id] });
                }
            },
            removeFavorite: (id: string) => {
                set({ favoriteIds: get().favoriteIds.filter((fid) => fid !== id) });
            },
            toggleFavorite: (id: string) => {
                const current = get().favoriteIds;
                if (current.includes(id)) {
                    set({ favoriteIds: current.filter((fid) => fid !== id) });
                } else {
                    set({ favoriteIds: [...current, id] });
                }
            },
            isFavorited: (id: string) => get().favoriteIds.includes(id),
            setLoading: (loading: boolean) => set({ isLoading: loading }),
        }),
        {
            name: 'favorites-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
