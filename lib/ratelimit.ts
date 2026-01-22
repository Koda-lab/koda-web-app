import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create a new ratelimiter, that allows 10 requests per 10 seconds
export const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, "10 s"),
    analytics: true,
    prefix: "@upstash/ratelimit",
});

/**
 * Vérifie le rate limit pour un identifiant donné (userId ou IP)
 * Renvoie true si la requête est autorisée, false sinon.
 */
export async function checkRateLimit(identifier: string) {
    if (!process.env.UPSTASH_REDIS_REST_URL) {
        console.warn("Rate limit désactivé: UPSTASH_REDIS_REST_URL manquant");
        return { success: true };
    }

    try {
        const { success } = await ratelimit.limit(identifier);
        return { success };
    } catch (error) {
        console.error("Erreur Rate Limit:", error);
        // En cas d'erreur Redis (down), on laisse passer pour ne pas bloquer les utilisateurs
        return { success: true };
    }
}
