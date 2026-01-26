
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from 'fs';
import path from 'path';

// Load env
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^["']|["']$/g, '');
            if (!process.env[key]) process.env[key] = value;
        }
    });
}

const s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

async function testUpload() {
    const bucket = process.env.AWS_S3_BUCKET_NAME;
    const region = process.env.AWS_REGION;
    console.log(`Config: Bucket=${bucket}, Region=${region}`);

    try {
        // 1. Generate URLs
        const fileKey = `test-upload-${Date.now()}.txt`;
        const command = new PutObjectCommand({
            Bucket: bucket,
            Key: fileKey,
            ContentType: "text/plain",
        });

        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });
        console.log("\n1. Signed URL generated successfully.");
        // console.log("URL:", uploadUrl);

        // 2. Try to upload using fetch (Server-side)
        console.log("2. Attempting PUT request from Node.js...");
        const res = await fetch(uploadUrl, {
            method: "PUT",
            body: "Hello World S3 Test",
            headers: { "Content-Type": "text/plain" }
        });

        if (res.ok) {
            console.log("✅ SUCCESS! Upload completed with status:", res.status);
            console.log("This proves Credentials, Region, and Bucket Name are CORRECT.");
            console.log("If it fails in the browser, the issue is CORS, AdBlock, or Network Firewall.");
        } else {
            console.error("❌ FAILED! Server responded with:", res.status, res.statusText);
            const text = await res.text();
            console.error("Response body:", text);
        }

    } catch (e) {
        console.error("❌ ERROR:", e);
    }
}

testUpload();
