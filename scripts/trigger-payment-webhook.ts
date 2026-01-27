
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

// 2. Main Function with Dynamic Imports
async function triggerWebhook() {
    try {
        console.log("🔌 Connecting to database...");

        const { connectToDatabase } = await import('../lib/db');
        const { default: Automation } = await import('../models/Automation');
        const { default: User } = await import('../models/User');

        await connectToDatabase();

        // 1. Fetch real products (try to get 2)
        const products = await Automation.find({}).limit(2);
        if (products.length === 0) {
            console.error("❌ No products found in database. Create one first.");
            process.exit(1);
        }

        const productIds = products.map(p => p._id.toString());
        const firstProduct = products[0];

        // 2. Fetch a real user (Buyer)
        // Try to find a user who is NOT the seller of the first product
        const buyer = await User.findOne({ clerkId: { $ne: firstProduct.sellerId } }) || await User.findOne({});

        if (!buyer) {
            console.error("❌ No users found in database. Create one first.");
            process.exit(1);
        }

        console.log(`\n📋 Using Test Data (${products.length} items):`);
        products.forEach((p, i) => {
            console.log(`   - Product ${i + 1}: ${p.title} (ID: ${p._id})`);
        });
        console.log(`   - Buyer:   ${buyer.email || buyer.clerkId} (ID: ${buyer.clerkId})`);

        // 3. Construct the Stripe CLI command
        const productIdsJson = JSON.stringify(productIds);

        // Escape quotes for the shell command
        const cmd = `stripe trigger checkout.session.completed --add checkout_session:metadata.userId="${buyer.clerkId}" --add checkout_session:metadata.productIds='${productIdsJson}'`;

        console.log(`\n🚀 Executing Stripe CLI command...`);
        console.log(`> ${cmd}`);

        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.error(`\n❌ Error execution Stripe CLI: ${error.message}`);
                console.error(`Make sure you have installed the Stripe CLI and ran 'stripe login'.`);
                return;
            }
            if (stderr) {
                console.log(stderr);
            }
            console.log(stdout);
            console.log(`\n✅ Webhook triggered!`);
            process.exit(0);
        });

    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

triggerWebhook();
