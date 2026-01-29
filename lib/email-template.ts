/**
 * Professional Email Template System for Koda
 * Provides consistent branding across all emails
 */

const APP_NAME = "Koda";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://koda.market";
const BRAND_COLOR = "#000000";
const ACCENT_COLOR = "#6366f1";
const SUCCESS_COLOR = "#10b981";

interface EmailTemplateOptions {
    title: string;
    preheader?: string;
    content: string;
    footerText?: string;
}

/**
 * Main email template wrapper
 * Wraps content in professional Koda-branded HTML
 */
export function emailTemplate({ title, preheader, content, footerText }: EmailTemplateOptions): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    ${preheader ? `<meta name="description" content="${preheader}">` : ''}
    <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <!-- Preheader Text (hidden) -->
    ${preheader ? `<div style="display: none; max-height: 0; overflow: hidden;">${preheader}</div>` : ''}
    
    <!-- Main Container -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5f5f5;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <!-- Email Container -->
                <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header with Logo -->
                    <tr>
                        <td align="center" style="padding: 40px 40px 30px 40px; border-bottom: 2px solid #f0f0f0;">
                            <h1 style="margin: 0; font-size: 32px; font-weight: 900; color: ${BRAND_COLOR}; letter-spacing: -0.5px;">
                                📦 ${APP_NAME}
                            </h1>
                            <p style="margin: 8px 0 0 0; font-size: 14px; color: #666; font-weight: 500;">
                                Marketplace for Automation Workflows
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px;">
                            ${content}
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #fafafa; border-top: 2px solid #f0f0f0; border-radius: 0 0 12px 12px;">
                            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <!-- Quick Links -->
                                        <div style="margin-bottom: 20px;">
                                            <a href="${APP_URL}" style="color: #666; text-decoration: none; font-size: 13px; margin: 0 12px;">Home</a>
                                            <span style="color: #ddd;">|</span>
                                            <a href="${APP_URL}/catalog" style="color: #666; text-decoration: none; font-size: 13px; margin: 0 12px;">Catalog</a>
                                            <span style="color: #ddd;">|</span>
                                            <a href="${APP_URL}/dashboard" style="color: #666; text-decoration: none; font-size: 13px; margin: 0 12px;">Dashboard</a>
                                            <span style="color: #ddd;">|</span>
                                            <a href="${APP_URL}/sell" style="color: #666; text-decoration: none; font-size: 13px; margin: 0 12px;">Sell</a>
                                        </div>
                                        
                                        ${footerText ? `<p style="margin: 0 0 16px 0; font-size: 12px; color: #888; line-height: 1.5;">${footerText}</p>` : ''}
                                        
                                        <!-- Copyright -->
                                        <p style="margin: 0; font-size: 12px; color: #999;">
                                            © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
}

/**
 * Creates a primary CTA button
 */
export function primaryButton(text: string, url: string): string {
    return `
        <a href="${url}" style="display: inline-block; background-color: ${BRAND_COLOR}; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 8px 8px 8px 0;">
            ${text}
        </a>
    `;
}

/**
 * Creates a secondary CTA button
 */
export function secondaryButton(text: string, url: string): string {
    return `
        <a href="${url}" style="display: inline-block; background-color: #ffffff; color: ${BRAND_COLOR}; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; border: 2px solid ${BRAND_COLOR}; margin: 8px 8px 8px 0;">
            ${text}
        </a>
    `;
}

/**
 * Creates an info box (for summaries, alerts, etc.)
 */
export function infoBox(content: string, type: 'info' | 'success' | 'warning' = 'info'): string {
    const colors = {
        info: { bg: '#f0f9ff', border: '#bae6fd', text: '#0c4a6e' },
        success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534' },
        warning: { bg: '#fef9c3', border: '#fde047', text: '#854d0e' }
    };

    const { bg, border, text } = colors[type];

    return `
        <div style="background-color: ${bg}; border: 2px solid ${border}; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <div style="color: ${text}; font-size: 14px; line-height: 1.6;">
                ${content}
            </div>
        </div>
    `;
}

/**
 * Creates a divider line
 */
export function divider(): string {
    return `<hr style="border: 0; border-top: 1px solid #e5e5e5; margin: 30px 0;" />`;
}
