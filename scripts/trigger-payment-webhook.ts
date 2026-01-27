
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
// We use dynamic imports to ensure env vars are set BEFORE the DB module loads
async function triggerWebhook() {
    try {
        console.log("🔌 Connecting to database...");

        // Dynamic imports to avoid hoisting checks
        const { connectToDatabase } = await import('../lib/db');
        const { default: Automation } = await import('../models/Automation');
        const { default: User } = await import('../models/User');

        await connectToDatabase();

        // 1. Fetch a real product (Automation)
        const product = await Automation.findOne({});
        if (!product) {
            console.error("❌ No products found in database. Create one first.");
            process.exit(1);
        }

        // 2. Fetch a real user (Buyer)
        // Try to find a user who is NOT the seller, if possible
        const buyer = await User.findOne({ clerkId: { $ne: product.sellerId } }) || await User.findOne({});

        if (!buyer) {
            console.error("❌ No users found in database. Create one first.");
            process.exit(1);
        }

        console.log(`\n📋 Using Test Data:`);
        console.log(`   - Product: ${product.title} (ID: ${product._id})`);
        console.log(`   - Buyer:   ${buyer.email || buyer.clerkId} (ID: ${buyer.clerkId})`);

        // 3. Construct the Stripe CLI command
        // We need to override the metadata to match what our webhook handler expects
        const productIdsJson = JSON.stringify([product._id.toString()]);

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
            console.log(`\n✅ Webhook triggered! Check your 'stripe listen' terminal window to see the event received by your local server.`);
            process.exit(0);
        });

    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

triggerWebhook();
