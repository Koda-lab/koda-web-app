
import { exec } from 'child_process';
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

async function checkPurchases() {
    try {
        console.log("🔌 Connecting to database...");
        // Dynamic imports
        const { connectToDatabase } = await import('../lib/db');
        const { default: Purchase } = await import('../models/Purchase');
        const { default: User } = await import('../models/User');
        const { default: Automation } = await import('../models/Automation'); // Register model

        await connectToDatabase();

        const email = process.argv[2];
        let query = {};

        if (email) {
            const user = await User.findOne({ email });
            if (user) {
                console.log(`Found user ${email} (ID: ${user.clerkId})`);
                query = { buyerId: user.clerkId };
            } else {
                // Try searching by clerkId directly
                const userById = await User.findOne({ clerkId: email });
                if (userById) {
                    console.log(`Found user by ID ${userById.clerkId} (${userById.email})`);
                    query = { buyerId: userById.clerkId };
                } else {
                    console.log(`User ${email} not found, listing ALL purchases.`);
                }
            }
        } else {
            console.log("No email provided, listing latest 10 purchases.");
        }

        const purchases = await Purchase.find(query)
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('productId', 'title');

        console.log(`\nFound ${purchases.length} purchases:`);
        purchases.forEach((p: any) => {
            console.log(`- [${p.createdAt.toISOString()}] Product: ${p.productId?.title || 'Unknown'} (${p.amount}€) - ID: ${p._id}`);
        });

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

checkPurchases();
