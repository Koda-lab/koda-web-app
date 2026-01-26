import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "@/lib/s3";
import { auth } from "@clerk/nextjs/server";
import { ratelimit } from "@/lib/ratelimit";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(req: Request) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    // RATE LIMITING
    const { success } = await ratelimit.limit(`upload_${userId}`);
    if (!success) {
        return NextResponse.json({ error: "Too many upload requests. Please try again later." }, { status: 429 });
    }

    try {
        const { fileName, fileType, fileSize } = await req.json();

        // VALIDATION SIZE
        if (!fileSize || fileSize > MAX_FILE_SIZE) {
            return NextResponse.json({ error: "File size too large (Max 50MB)" }, { status: 400 });
        }

        // On crée un nom de fichier unique pour éviter les doublons
        const fileKey = `uploads/${userId}/${Date.now()}-${fileName}`;

        const command = new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: fileKey,
            ContentType: fileType,
        });

        // L'URL expire après 60 secondes pour la sécurité
        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });

        return NextResponse.json({
            uploadUrl,
            fileUrl: `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`
        });

    } catch (error) {
        console.error("S3 Upload Error:", error);
        return NextResponse.json({ error: "Failed to generate the URL" }, { status: 500 });
    }
}