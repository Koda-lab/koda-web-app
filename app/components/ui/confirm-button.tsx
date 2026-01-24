"use client";

import { ReactNode } from "react";
import { Button, buttonVariants } from "./button";
import { VariantProps } from "class-variance-authority";

interface ConfirmButtonProps extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
    confirmMessage: string;
    children: ReactNode;
    asChild?: boolean; // Required by Button if we want to pass it
}

export function ConfirmButton({
    confirmMessage,
    children,
    onClick,
    ...props
}: ConfirmButtonProps) {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!window.confirm(confirmMessage)) {
            e.preventDefault();
            return;
        }
        if (onClick) onClick(e);
    };

    return (
        <Button {...props} onClick={handleClick}>
            {children}
        </Button>
    );
}
