
import fs from 'fs';
import path from 'path';

// 1. Load env BEFORE importing db
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    console.log("Loading environment from .env.local...");
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^["']|["']$/g, '');
            if (!process.env[key]) {
                process.env[key] = value;
            }
        }
    });
}

async function dropIndex() {
    try {
        console.log("🔌 Connecting to database...");
        const { connectToDatabase } = await import('../lib/db');
        const { default: Purchase } = await import('../models/Purchase');

        await connectToDatabase();

        console.log("Checking indexes for Purchase collection...");
        const indexes = await Purchase.collection.indexes();
        console.log("Existing indexes:", indexes);

        const indexName = "stripeSessionId_1";
        const indexExists = indexes.some(idx => idx.name === indexName);

        if (indexExists) {
            console.log(`🗑️ Dropping index '${indexName}'...`);
            await Purchase.collection.dropIndex(indexName);
            console.log("✅ Index dropped successfully.");
        } else {
            console.log(`Index '${indexName}' not found. It might have been already dropped.`);
        }

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

dropIndex();
