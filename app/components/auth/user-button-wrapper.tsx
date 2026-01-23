"use client";

import { UserButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function UserButtonWrapper() {
    // Force client-side rendering only
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return <UserButton afterSignOutUrl="/" />;
}
