import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";
import { ratelimit } from "@/lib/ratelimit";
import { auth } from "@clerk/nextjs/server";
import path from "path";

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

    const { success } = await ratelimit.limit(`upload_image_${userId}`);
    if (!success) {
        return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    try {
        const { fileName, fileType, fileSize } = await req.json();

        if (!fileSize || fileSize > MAX_IMAGE_SIZE) {
            return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
        }

        const allowedExtensions = ALLOWED_IMAGE_TYPES[fileType];
        if (!allowedExtensions) {
            return NextResponse.json({ error: `File type not allowed: ${fileType}` }, { status: 400 });
        }

        const originalExtension = path.extname(fileName).toLowerCase();
        if (!allowedExtensions.includes(originalExtension)) {
            return NextResponse.json({ error: "Invalid file extension" }, { status: 400 });
        }

        const sanitizedFileName = path.basename(fileName, originalExtension).replace(/[^a-zA-Z0-9-_]/g, "");
        const safeFileName = `${sanitizedFileName}${originalExtension}`;
        const fileKey = `images/${userId}/${Date.now()}-${safeFileName}`;

        // SIMPLIFICATION MAJEURE ICI :
        // On ne met QUE le ContentType. Si on ajoute Metadata ou ContentDisposition ici,
        // le client DOIT impérativement les envoyer aussi dans le PUT, sinon la signature échoue.
        const command = new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: fileKey,
            ContentType: fileType,
        });

        const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 });
        const s3Url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

        return NextResponse.json({
            uploadUrl,
            fileUrl: s3Url
        });

    } catch (error) {
        console.error("Image Upload Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const { success } = await ratelimit.limit(`image_proxy_${ip}`);

    if (!success) return new NextResponse("Too Many Requests", { status: 429 });

    const { searchParams } = new URL(req.url);
    const imageUrl = searchParams.get("url");

    if (!imageUrl) return new NextResponse("Missing URL", { status: 400 });

    let fileKey = "";
    try {
        const urlObj = new URL(imageUrl);
        fileKey = decodeURIComponent(urlObj.pathname.substring(1));
    } catch {
        return new NextResponse("Invalid URL", { status: 400 });
    }

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

        // @ts-ignore
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