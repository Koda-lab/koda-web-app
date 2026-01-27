/**
 * Transforme une URL S3 en URL publique pour l'affichage.
 * Maintenant que Next.js Image est configuré pour S3, on retourne directement l'URL.
 * @param s3Url L'URL complète stockée en base (ex: https://bucket.s3...)
 * @returns L'URL S3 ou une image par défaut
 */
export function getPublicImageUrl(s3Url?: string | null) {
    if (!s3Url) return "/placeholder-image.jpg";

    // FIX: Si l'URL passe déjà par notre proxy API, on la retourne direct pour éviter le double encodage
    if (s3Url.includes("/api/image")) return s3Url;

    // Si c'est déjà une URL relative, on ne touche pas
    if (s3Url.startsWith("/")) return s3Url;

    // Si c'est une URL S3 (amazon, etc), on la passe dans le proxy
    if (s3Url.includes("s3") && s3Url.includes("amazonaws")) {
        return `/api/image?url=${encodeURIComponent(s3Url)}`;
    }

    return s3Url;
}