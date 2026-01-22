import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

export async function getDownloadUrl(fileKey: string) {
    const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: fileKey, // Le nom du fichier dans S3
    });

    // Génère un lien valide pendant 300 secondes (5 minutes)
    return await getSignedUrl(s3Client, command, { expiresIn: 300 });
}