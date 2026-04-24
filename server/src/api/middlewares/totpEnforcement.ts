/**
 * totpEnforcement.ts
 *
 * Enforces TOTP verification for admin users.
 *
 * Flow:
 *   1. User (admin) logs in with email OTP — session created.
 *   2. This middleware intercepts every /api/admin/* request.
 *   3. If user is admin AND has TOTP enabled AND session lacks twoFactorVerified:
 *      → 403 with { requiresTOTP: true } — frontend redirects to TOTP prompt.
 *   4. Admin enters authenticator app code → POST /api/auth/two-factor/verify-totp
 *      → better-auth marks session as twoFactorVerified = true.
 *   5. Subsequent admin requests pass through.
 *
 * REGISTRATION FLOW (first time):
 *   Admin calls GET /api/auth/two-factor/get-totp-uri → gets QR code URI.
 *   Admin scans with Google Authenticator / Authy.
 *   Admin calls POST /api/auth/two-factor/enable-totp with a verification code.
 *   From that point, every admin login session requires TOTP.
 *
 * WHERE TO APPLY:
 *   In main.ts, before routing-controllers:
 *     import { adminTotpEnforcement } from './api/middlewares/totpEnforcement.js';
 *     app.use('/api/admin', adminTotpEnforcement);
 */

import { Request, Response, NextFunction } from 'express';
import { auth } from '../../lib/auth.js';

export async function adminTotpEnforcement(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Fetch current session from better-auth
    const session = await auth.api.getSession({ headers: req.headers as any });

    if (!session?.user) {
      // Not authenticated at all — let authorizationChecker handle this
      next();
      return;
    }

    const user = session.user as any;

    // Only enforce on admin accounts
    if (user.role !== 'admin') {
      next();
      return;
    }

    // Admin has TOTP enabled but hasn't verified it this session
    if (user.twoFactorEnabled && !session.session?.twoFactorVerified) {
      res.status(403).json({
        error: 'TOTP verification required.',
        requiresTOTP: true,
        hint: 'POST /api/auth/two-factor/verify-totp with your authenticator code.',
      });
      return;
    }

    next();
  } catch (err) {
    // Session fetch failed — let downstream handle auth
    next();
  }
}
