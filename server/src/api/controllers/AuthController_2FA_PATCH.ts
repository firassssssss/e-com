// src/api/controllers/AuthController_2FA_PATCH.ts
// ─────────────────────────────────────────────────────────────────
// This is NOT a standalone file — it shows the 2FA methods to ADD
// (or replace) inside your existing AuthController.ts
//
// The full 2FA login flow:
//
//  Step 1  POST /auth/login      → validates password → sends OTP email
//  Step 2  POST /auth/verify-otp → validates OTP     → issues JWT
//
// ─────────────────────────────────────────────────────────────────

import { Request, Response } from 'express';
import { OtpService }               from '../../core/services/OtpService';
import { NodemailerEmailService }    from '../../infrastructure/services/NodemailerEmailService';
import { JwtService }                from '../../core/services/JwtService';
import { BcryptPasswordHasher }      from '../../adapters/security/BcryptPasswordHasher';
import { auditFromRequest }          from '../../infrastructure/security/auditLogger';
import { recordFailedAttempt, clearFailedAttempts } from '../middlewares/bruteForceMiddleware';

// Instantiate (or inject via your DI container in AppContainers.ts)
const otpService   = new OtpService();
const emailService = new NodemailerEmailService();
const jwtService   = new JwtService();
const hasher       = new BcryptPasswordHasher();

// ══════════════════════════════════════════════════════════════════
//  STEP 1 — POST /auth/login
//  Validates credentials, sends OTP, returns partial session token
// ══════════════════════════════════════════════════════════════════
export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    // 1. Look up user by email (use your existing UserRepository)
    //    const user = await userRepo.findByEmail(email);
    //    Replace the line below with your actual lookup:
    const user = await (req as any).container.userRepo.findByEmail(email);

    if (!user) {
      await recordFailedAttempt(req, email);
      await auditFromRequest(req, 'LOGIN_FAILED', undefined, { email, reason: 'user_not_found' });
      // Return same message as wrong password — never reveal which is wrong
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // 2. Verify password
    const passwordValid = await hasher.compare(password, user.passwordHash);
    if (!passwordValid) {
      await recordFailedAttempt(req, email);
      await auditFromRequest(req, 'LOGIN_FAILED', user.id, { reason: 'wrong_password' });
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // 3. Check for active OTP (prevent spam — enforce 60s resend cooldown)
    if (await otpService.isPending(user.id)) {
      const remaining = await otpService.ttl(user.id);
      if (remaining > (10 * 60 - 60)) { // less than 60s since last send
        return res.status(429).json({
          error:   'A verification code was already sent. Please wait before requesting another.',
          retryIn: remaining - (10 * 60 - 60),
        });
      }
    }

    // 4. Generate OTP and send email
    const otp = await otpService.generate(user.id);
    await emailService.sendOtp(user.email, otp, 10);
    await auditFromRequest(req, '2FA_SENT', user.id);

    // 5. Issue a short-lived "pre-auth" token (not a full session token)
    //    This lets the client call /verify-otp without sending the password again.
    //    It carries only the userId and a flag that it is pre-auth only.
    const preAuthToken = jwtService.sign(
      { userId: user.id, stage: 'pre-auth' },
      '10m', // expires with the OTP
    );

    await clearFailedAttempts(req, email);

    return res.status(200).json({
      message:      'Verification code sent to your email.',
      preAuthToken, // client stores this temporarily
    });

  } catch (err) {
    console.error('[AuthController] login error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// ══════════════════════════════════════════════════════════════════
//  STEP 2 — POST /auth/verify-otp
//  Validates OTP from email → issues full JWT access + refresh tokens
// ══════════════════════════════════════════════════════════════════
export async function verifyOtp(req: Request, res: Response) {
  const { otp }          = req.body;
  const authHeader       = req.headers.authorization ?? '';
  const preAuthToken     = authHeader.replace('Bearer ', '');

  if (!otp || !preAuthToken) {
    return res.status(400).json({ error: 'OTP and pre-auth token are required.' });
  }

  try {
    // 1. Decode and verify the pre-auth token
    let payload: { userId: string; stage: string };
    try {
      payload = jwtService.verify(preAuthToken) as typeof payload;
    } catch {
      return res.status(401).json({ error: 'Pre-auth token expired or invalid. Please log in again.' });
    }

    if (payload.stage !== 'pre-auth') {
      return res.status(401).json({ error: 'Invalid token type.' });
    }

    const { userId } = payload;

    // 2. Verify OTP
    const result = await otpService.verify(userId, otp);

    if (!result.success) {
      await auditFromRequest(req, '2FA_FAILED', userId, { reason: result.reason });

      const messages: Record<string, string> = {
        expired: 'Verification code has expired. Please log in again.',
        invalid: 'Incorrect verification code.',
        locked:  'Too many incorrect attempts. Please log in again to get a new code.',
      };
      return res.status(401).json({ error: messages[result.reason] ?? 'Verification failed.' });
    }

    // 3. OTP valid — look up user and issue full tokens
    //    Replace with your actual user lookup:
    const user = await (req as any).container.userRepo.findById(userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found.' });
    }

    // 4. Issue access token (short-lived) + refresh token (long-lived)
    const accessToken  = jwtService.sign({ userId: user.id, role: user.role }, '15m');
    const refreshToken = jwtService.sign({ userId: user.id, type: 'refresh' }, '7d');

    await auditFromRequest(req, '2FA_VERIFIED', user.id);
    await auditFromRequest(req, 'LOGIN_SUCCESS', user.id);

    return res.status(200).json({
      accessToken,
      refreshToken,
      user: {
        id:    user.id,
        email: user.email,
        role:  user.role,
      },
    });

  } catch (err) {
    console.error('[AuthController] verifyOtp error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// ══════════════════════════════════════════════════════════════════
//  LOGOUT — POST /auth/logout
// ══════════════════════════════════════════════════════════════════
export async function logout(req: Request, res: Response) {
  const token = req.headers.authorization?.split(' ')[1];

  if (token) {
    const { blacklistToken } = await import('../middlewares/tokenBlacklist');
    await blacklistToken(token);
  }

  // Also invalidate any pending OTP for this user
  const userId = (req as any).user?.userId;
  if (userId) {
    await otpService.invalidate(userId);
    await auditFromRequest(req, 'LOGOUT', userId);
  }

  return res.status(200).json({ message: 'Logged out successfully.' });
}

// ══════════════════════════════════════════════════════════════════
//  ROUTES — add to your auth router
// ══════════════════════════════════════════════════════════════════
//
//  import { bruteForce } from '../middlewares/bruteForceMiddleware';
//  import { login, verifyOtp, logout } from './AuthController';
//
//  router.post('/login',      bruteForce, login);
//  router.post('/verify-otp', bruteForce, verifyOtp);
//  router.post('/logout',     authMiddleware, logout);