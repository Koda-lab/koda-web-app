import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";
import { ratelimit } from "@/lib/ratelimit";
import { auth } from "@clerk/nextjs/server";
import path from "path";

// On recrée le client ici ou on l'importe. Pour éviter les soucis de Edge Runtime, on utilise Node.js runtime par défaut.
const s3 = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

const ALLOWED_IMAGE_TYPES: Record<string, string[]> = {
    "image/png": [".png"],
    "image/jpeg": [".jpg", ".jpeg"],
    "image/webp": [".webp"],
    "image/gif": [".gif"],
};

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // RATE LIMITING
    const { success } = await ratelimit.limit(`upload_image_${userId}`);
    if (!success) {
        return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    try {
        const { fileName, fileType, fileSize } = await req.json();

        // VALIDATION TAILLE
        if (!fileSize || fileSize > MAX_IMAGE_SIZE) {
            return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
        }

        // VALIDATION TYPE MIME
        const allowedExtensions = ALLOWED_IMAGE_TYPES[fileType];
        if (!allowedExtensions) {
            return NextResponse.json({
                error: `File type not allowed: ${fileType}`
            }, { status: 400 });
        }

        // ANTI-SPOOFING: VÉRIFICATION EXTENSION vs MIME TYPE
        const originalExtension = path.extname(fileName).toLowerCase();
        if (!allowedExtensions.includes(originalExtension)) {
            console.error(`Spoofing attempt? MIME '${fileType}' does not match extension '${originalExtension}'`);
            return NextResponse.json({
                error: "Invalid file extension for the provided file type"
            }, { status: 400 });
        }

        // SANITIZATION
        const sanitizedFileName = path.basename(fileName, originalExtension)
            .replace(/[^a-zA-Z0-9-_]/g, "");

        const safeFileName = `${sanitizedFileName}${originalExtension}`;
        const fileKey = `images/${userId}/${Date.now()}-${safeFileName}`;

        const command = new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: fileKey,
            ContentType: fileType,
            // SECURITY: Inline pour l'affichage, mais le Content-Type strict empêche l'exécution de script HTML malveillant
            ContentDisposition: `inline; filename="${safeFileName}"`,
            Metadata: {
                userId: userId,
                originalName: fileName,
                mimeType: fileType
            }
        });

        const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 });
        const s3Url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

        return NextResponse.json({
            uploadUrl,
            // On renvoie l'URL proxifiée pour que le front puisse afficher l'image (si bucket privé)
            fileUrl: `${req.nextUrl.origin}/api/image?url=${encodeURIComponent(s3Url)}`
        });

    } catch (error) {
        console.error("Image Upload Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    // RATE LIMITING
    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const { success } = await ratelimit.limit(`image_proxy_${ip}`);

    if (!success) {
        return new NextResponse("Too Many Requests", { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
        return new NextResponse("Missing URL", { status: 400 });
    }

    // Sécurité basique : On vérifie que ça vient bien de notre bucket
    // if (!imageUrl.includes(process.env.AWS_BUCKET_NAME!)) {
    //    return new NextResponse("Forbidden Domain", { status: 403 });
    // }

    // Extraction de la clé S3 depuis l'URL complète
    // Ex: https://bucket.s3.region.amazonaws.com/uploads/xyz.jpg -> uploads/xyz.jpg
    let fileKey = "";
    try {
        const urlObj = new URL(imageUrl);
        // Le pathname commence par /, on l'enlève
        fileKey = decodeURIComponent(urlObj.pathname.substring(1));
    } catch {
        return new NextResponse("Invalid URL", { status: 400 });
    }

    // IMPORTANT DE SECURITE : On refuse de servir les .json via cette route
    // Sinon n'importe qui pourrait télécharger les produits sans payer
    if (fileKey.endsWith(".json")) {
        return new NextResponse("Forbidden File Type", { status: 403 });
    }

    try {
        const command = new GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: fileKey,
        });

        const response = await s3.send(command);
        const stream = response.Body as Readable;

        // On renvoie le stream directement
        // @ts-ignore - ReadableStream web vs Node stream mismatch, compatible in Next.js
        return new NextResponse(stream, {
            headers: {
                "Content-Type": response.ContentType || "image/jpeg",
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });
    } catch (error) {
        console.error("Image Proxy Error:", error);
        return new NextResponse("Image not found", { status: 404 });
    }
}
