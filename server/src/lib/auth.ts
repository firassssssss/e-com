// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { bearer, openAPI, emailOTP, twoFactor } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from '../infrastructure/db/index.js';
import { NodemailerEmailService } from '../infrastructure/services/NodemailerEmailService.js';

const emailService = new NodemailerEmailService();

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
    }),
    emailAndPassword: {
        enabled: true,
    },
    session: {
        user: {
            fields: ['id', 'name', 'email', 'role']
        }
    },
    trustedOrigins: [
        "http://localhost:3001",
    ],
    plugins: [
        bearer(),
        openAPI(),

        // ── Email OTP (primary auth for all users) ─────────────────────────
        emailOTP({
            async sendVerificationOTP({ email, otp, type }) {
                if (process.env.BYPASS_OTP === 'true') {
                    // Dev bypass: print OTP to console instead of sending email.
                    // Use the code shown here when the frontend asks for OTP.
                    console.log(`\n[Auth] ⚡ BYPASS_OTP active — ${type} OTP for ${email}: \x1b[33m${otp}\x1b[0m\n`);
                    return;
                }
                await emailService.sendOtp(email, otp, 10);
            },
            otpLength: 6,
            expiresIn: 600,
        }),

        // ── TOTP (second factor — required for admin accounts) ─────────────
        // Endpoints exposed:
        //   POST /api/auth/two-factor/enable-totp    → returns QR code URI
        //   POST /api/auth/two-factor/verify-totp    → verifies code, marks session
        //   POST /api/auth/two-factor/disable-totp
        //   GET  /api/auth/two-factor/get-totp-uri   → re-fetch QR code URI
        twoFactor({
            issuer: "PFE2026 Lacuna",
            totpOptions: {
                digits: 6,
                period: 30,   // seconds — standard TOTP (Google Authenticator compatible)
            },
        }),
    ]
});
