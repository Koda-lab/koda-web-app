import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { connectToDatabase } from '@/lib/db'
import User from '@/models/User'
import { revalidatePath } from 'next/cache'

export async function POST(req: Request) {
    // You can find this in the Clerk Dashboard -> Webhooks -> choose the webhook
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

    if (!WEBHOOK_SECRET) {
        throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local')
    }

    // Get the headers
    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response('Error occured -- no svix headers', {
            status: 400
        })
    }

    // Get the body
    const payload = await req.json()
    const body = JSON.stringify(payload)

    // Create a new Svix instance with your secret.
    const wh = new Webhook(WEBHOOK_SECRET)

    let evt: WebhookEvent

    // Verify the payload with the headers
    try {
        evt = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        }) as WebhookEvent
    } catch (err) {
        console.error('Error verifying webhook:', err);
        return new Response('Error occured', {
            status: 400
        })
    }

    // Handle the event
    const eventType = evt.type;

    if (eventType === 'user.created' || eventType === 'user.updated') {
        const { id, email_addresses, first_name, last_name, image_url } = evt.data;

        const email = email_addresses && email_addresses.length > 0 ? email_addresses[0].email_address : null;

        await connectToDatabase();

        try {
            await User.findOneAndUpdate(
                { clerkId: id },
                {
                    clerkId: id,
                    email: email,
                    firstName: first_name,
                    lastName: last_name,
                    imageUrl: image_url,
                },
                { upsert: true, new: true }
            );
            console.log(`User ${id} synced to DB`);

            // Send welcome email for new users only
            if (eventType === 'user.created' && email) {
                const { sendWelcomeEmail } = await import('@/lib/emails');
                await sendWelcomeEmail(email, first_name);
            }

            // Revalidate admin dashboard to show new/updated users immediately
            revalidatePath('/admin');
        } catch (error) {
            console.error(`Error syncing user ${id}:`, error);
            return new Response('Error syncing user', { status: 500 });
        }
    }

    if (eventType === 'user.deleted') {
        const { id } = evt.data;
        await connectToDatabase();
        try {
            await User.findOneAndDelete({ clerkId: id });
            console.log(`User ${id} deleted from DB`);

            // Revalidate admin dashboard to remove deleted users immediately
            revalidatePath('/admin');
        } catch (error) {
            console.error(`Error deleting user ${id}:`, error);
            return new Response('Error deleting user', { status: 500 });
        }
    }

    return new Response('', { status: 200 })
}
