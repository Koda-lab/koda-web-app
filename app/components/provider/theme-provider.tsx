"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
// Note: Si tu as une erreur de type sur les props, tu peux utiliser :
// import { type ThemeProviderProps } from "next-themes/dist/types"

export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
    return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}