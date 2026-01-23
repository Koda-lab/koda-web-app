"use client";

import dynamic from 'next/dynamic';

const CartSheet = dynamic(() => import('@/app/components/cart/cart-sheet'), { ssr: false });

export default function CartSheetWrapper() {
    return <CartSheet />;
}
