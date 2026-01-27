import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "@/lib/s3";
import { auth } from "@clerk/nextjs/server";
import { ratelimit } from "@/lib/ratelimit";
import path from "path";


const ALLOWED_FILE_TYPES: Record<string, string[]> = {
    "application/json": [".json"],
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(req: Request) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // RATE LIMITING
    const { success } = await ratelimit.limit(`upload_${userId}`);
    if (!success) {
        return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    try {
        const { fileName, fileType, fileSize } = await req.json();

        // 2. VALIDATION TAILLE
        if (!fileSize || fileSize > MAX_FILE_SIZE) {
            console.error(`Upload refused: File too large (${fileSize})`);
            return NextResponse.json({ error: "File too large" }, { status: 400 });
        }

        // 3. VALIDATION TYPE MIME (Allowlist)
        const allowedExtensions = ALLOWED_FILE_TYPES[fileType];
        if (!allowedExtensions) {
            console.error(`Upload refused: Invalid MIME type '${fileType}' for file '${fileName}'`);
            return NextResponse.json({
                error: `File type not allowed: ${fileType}`
            }, { status: 400 });
        }

        // 4. VÉRIFICATION CROISÉE EXTENSION vs MIME
        // On récupère l'extension réelle du fichier envoyé
        const originalExtension = path.extname(fileName).toLowerCase();

        // On vérifie si l'extension correspond au mime type déclaré
        if (!allowedExtensions.includes(originalExtension)) {
            console.error(`Upload refused: Mismatch extension '${originalExtension}' for MIME '${fileType}'`);
            return NextResponse.json({
                error: "Invalid file extension for the provided file type"
            }, { status: 400 });
        }

        // 5. SANITIZATION DU NOM DE FICHIER
        // On ne garde que les caractères alphanumériques, tirets et underscores pour éviter les injections de chemin
        const sanitizedFileName = path.basename(fileName, originalExtension)
            .replace(/[^a-zA-Z0-9-_]/g, "");

        const safeFileName = `${sanitizedFileName}${originalExtension}`;
        const fileKey = `uploads/${userId}/${Date.now()}-${safeFileName}`;

        // 6. SÉCURISATION DE LA COMMANDE S3
        const isImage = fileType.startsWith("image/");
        const contentDisposition = isImage
            ? `inline; filename="${safeFileName}"`
            : `attachment; filename="${safeFileName}"`;

        const command = new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: fileKey,
            ContentType: fileType,
            // CRITIQUE : Force le téléchargement pour les non-images pour éviter XSS (fichiers HTML, SVG, etc)
            // Pour les images, on permet l'affichage inline
            ContentDisposition: contentDisposition,
            // Cache control pour les images (1 an immutable)
            CacheControl: isImage ? "public, max-age=31536000, immutable" : undefined,
            // Métadonnées pour suivi éventuel
            Metadata: {
                userId: userId,
                originalName: fileName
            }
        });

        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });

        return NextResponse.json({
            uploadUrl,
            fileUrl: `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`
        });

    } catch (error) {
        console.error("S3 Upload Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}