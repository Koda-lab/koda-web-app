"use client";

import dynamic from 'next/dynamic';

const FavoritesSheet = dynamic(() => import('@/app/components/favorites/favorites-sheet'), { ssr: false });

export default function FavoritesSheetWrapper() {
    return <FavoritesSheet />;
}
