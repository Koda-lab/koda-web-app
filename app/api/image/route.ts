import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";

// On recrée le client ici ou on l'importe. Pour éviter les soucis de Edge Runtime, on utilise Node.js runtime par défaut.
const s3 = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

export async function GET(req: NextRequest) {
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
