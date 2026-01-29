import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)', '/api(.*)']);

export default clerkMiddleware(async (auth, req) => {
    if (isPublicRoute(req)) {
        // do nothing for public routes
    } else {
        // await auth.protect(); // Uncomment if you want to protect all other routes
    }

    // Si c'est une route API, on ne l'internationalise pas
    if (req.nextUrl.pathname.startsWith('/api')) {
        // Skip rate limiting for webhooks (Stripe sends many events quickly)
        if (req.nextUrl.pathname.startsWith('/api/webhooks')) {
            return;
        }

        // Rate Limiting (Protection DDoS / Billing)
        // On ne limite que l'API, pas les assets ni les pages
        try {
            const { ratelimit } = await import("@/lib/ratelimit");
            const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
            const { success } = await ratelimit.limit(ip);

            if (!success) {
                return new Response("Too Many Requests", { status: 429 });
            }
        } catch (err) {
            console.error("Rate limit error", err);
            // En cas d'erreur Redis (ex: pas de clés), on laisse passer pour ne pas bloquer le site
            // sauf si on veut être strict. Ici on log juste.
        }

        return;
    }

    return intlMiddleware(req);
});


export const config = {
    matcher: [
        // Enable a redirect to a matching locale at the root
        '/',

        // Set a cookie to remember the previous locale for
        // all requests that have a locale prefix
        '/(fr|en)/:path*',

        // Enable redirects that add missing locales
        // (e.g. `/pathnames` -> `/en/pathnames`)
        '/((?!_next|_vercel|.*\\..*).*)',

        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ]
};

