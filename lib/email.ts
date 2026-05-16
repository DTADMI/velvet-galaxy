import { Resend } from "resend";

let resend: Resend | null = null;

export function getResend(): Resend | null {
    if (resend) return resend;

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.warn("[VG:Email] Missing RESEND_API_KEY. Email notifications disabled.");
        return null;
    }

    resend = new Resend(apiKey);
    return resend;
}

export async function sendEmail(params: {
    to: string;
    subject: string;
    html: string;
}): Promise<{ success: boolean; error?: string }> {
    const client = getResend();
    if (!client) {
        return { success: false, error: "Email service not configured" };
    }

    try {
        const { error } = await client.emails.send({
            from: process.env.RESEND_FROM_EMAIL || "Velvet Galaxy <noreply@velvetgalaxy.app>",
            to: params.to,
            subject: params.subject,
            html: params.html,
        });

        if (error) {
            console.error("[VG:Email] Send failed:", error);
            return { success: false, error: error.message };
        }
        return { success: true };
    } catch (err) {
        console.error("[VG:Email] Send failed:", err);
        return { success: false, error: "Failed to send email" };
    }
}

export async function sendSecurityNotification(
    email: string,
    event: "mfa_change" | "password_change" | "suspicious_login" | "account_locked",
    details?: Record<string, string>
): Promise<void> {
    const subjects: Record<string, string> = {
        mfa_change: "Security Alert: MFA settings changed",
        password_change: "Security Alert: Password changed",
        suspicious_login: "Security Alert: New device sign-in detected",
        account_locked: "Security Alert: Account temporarily locked",
    };

    const bodies: Record<string, string> = {
        mfa_change: `
            <h2>MFA Settings Changed</h2>
            <p>Your multi-factor authentication settings were changed on Velvet Galaxy.</p>
            <p>If this wasn't you, please secure your account immediately.</p>
        `,
        password_change: `
            <h2>Password Changed</h2>
            <p>Your Velvet Galaxy account password was changed.</p>
            <p>If this wasn't you, please reset your password immediately.</p>
        `,
        suspicious_login: `
            <h2>New Sign-in Detected</h2>
            <p>A new sign-in to your Velvet Galaxy account was detected.</p>
            ${details?.device ? `<p>Device: ${details.device}</p>` : ""}
            ${details?.location ? `<p>Location: ${details.location}</p>` : ""}
            <p>If this wasn't you, please change your password immediately.</p>
        `,
        account_locked: `
            <h2>Account Temporarily Locked</h2>
            <p>Your Velvet Galaxy account has been temporarily locked due to multiple failed sign-in attempts.</p>
            <p>Please wait a few minutes before trying again, or use the password reset option.</p>
        `,
    };

    await sendEmail({
        to: email,
        subject: subjects[event] || "Security Alert",
        html: bodies[event] || "<p>A security event occurred on your account.</p>",
    });
}
