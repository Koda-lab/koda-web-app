import { ratelimit } from "../lib/ratelimit";

async function testRateLimit() {
    console.log("🚀 Starting Rate Limit Test...");
    console.log("Simulating 15 requests (Limit is 10/10s)...");

    for (let i = 1; i <= 15; i++) {
        const start = Date.now();
        // Simulate a unique user IP for this test run
        const { success, limit, remaining, reset } = await ratelimit.limit("test-user-ip");
        const duration = Date.now() - start;

        if (success) {
            console.log(`✅ Request ${i}: Allowed (Remaining: ${remaining}) - ${duration}ms`);
        } else {
            console.log(`Cb Request ${i}: BLOCKED 429 (Reset in ${(reset - Date.now()) / 1000}s)`);
        }
    }
}

testRateLimit().catch(console.error);
