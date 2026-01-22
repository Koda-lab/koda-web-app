/**
 * Transforme une URL S3 brute en URL via notre Proxy pour l'affichage sécurisé.
 * @param s3Url L'URL complète stockée en base (ex: https://bucket.s3...)
 * @returns L'URL proxifiée (ex: /api/image?url=...) ou une image par défaut
 */
export function getPublicImageUrl(s3Url?: string | null) {
    if (!s3Url) return "/placeholder-image.jpg"; // Tu peux mettre une vraie image par défaut ici
    if (s3Url.startsWith("http")) {
        return `/api/image?url=${encodeURIComponent(s3Url)}`;
    }
    return s3Url;
}
