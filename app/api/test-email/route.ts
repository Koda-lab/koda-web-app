import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { sendWelcomeEmail } from '@/lib/emails';

/**
 * Test endpoint for sending emails
 * GET /api/test-email?type=welcome
 */
export async function GET(request: Request) {
    try {
        const user = await currentUser();

        if (!user || !user.emailAddresses?.[0]?.emailAddress) {
            return NextResponse.json(
                { error: 'You must be logged in to test emails' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'welcome';
        const email = user.emailAddresses[0].emailAddress;
        const firstName = user.firstName;

        let result;

        switch (type) {
            case 'welcome':
                result = await sendWelcomeEmail(email, firstName);
                break;

            default:
                return NextResponse.json(
                    { error: 'Invalid email type. Use ?type=welcome' },
                    { status: 400 }
                );
        }

        if (result?.error) {
            return NextResponse.json(
                {
                    success: false,
                    error: result.error,
                    message: 'Email sending failed. Make sure you have verified your domain on Resend.'
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `${type} email sent successfully to ${email}!`,
            emailId: result?.data?.id,
            note: 'If you don\'t receive it, check your spam folder or verify your Resend domain.'
        });

    } catch (error: any) {
        console.error('Test email error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Unknown error',
                hint: 'Make sure Resend is properly configured in your .env.local'
            },
            { status: 500 }
        );
    }
}
