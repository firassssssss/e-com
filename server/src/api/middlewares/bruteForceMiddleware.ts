// src/api/middlewares/bruteForceMiddleware.ts  (REPLACES previous version)
// FIX: tracks by EMAIL ONLY — IP rotation no longer bypasses lockout
// REQUIRES: redis client from src/infrastructure/redis/index.ts

import { Request, Response, NextFunction } from 'express';
import { redis } from '../../infrastructure/redis/index';
import { auditFromRequest } from '../../infrastructure/security/auditLogger';

const MAX_ATTEMPTS   = 5;
const WINDOW_SEC     = 300;    // 5-minute sliding window
const LOCKOUT_SEC    = 15 * 60; // 15-minute lockout

// ── KEY DESIGN ───────────────────────────────────────────────────
// OLD (bypassable): brute:{ip}:{email}  — new IP = fresh counter
// NEW (secure):     brute:acct:{email}  — IP does not matter
//
// We also keep a secondary IP-level key to catch credential stuffing
// (same IP trying many different accounts).

function acctKey(email: string)    { return `brute:acct:${email.toLowerCase().trim()}`; }
function acctLock(email: string)   { return `lock:acct:${email.toLowerCase().trim()}`; }
function ipKey(ip: string)         { return `brute:ip:${ip}`; }

// ── CHECK — runs before the login handler ───────────────────────
export async function bruteForce(req: Request, res: Response, next: NextFunction) {
  const email = (req.body?.email ?? '').toLowerCase().trim();
  const ip    = req.ip ?? 'unknown';

  if (!email) return next();

  // 1. Check account-level lock (primary defence)
  const acctLocked = await redis.get(acctLock(email));
  if (acctLocked) {
    const ttl = await redis.ttl(acctLock(email));
    await auditFromRequest(req, 'LOGIN_LOCKED', undefined, { email, reason: 'account_lockout', retryIn: ttl });
    return res.status(429).json({
      error:   'Account temporarily locked due to too many failed attempts.',
      retryIn: ttl,
    });
  }

  // 2. Check IP-level lock (secondary defence against credential stuffing)
  const ipLocked = await redis.get(`lock:ip:${ip}`);
  if (ipLocked) {
    const ttl = await redis.ttl(`lock:ip:${ip}`);
    return res.status(429).json({
      error:   'Too many requests from your network. Please wait.',
      retryIn: ttl,
    });
  }

  next();
}

// ── RECORD FAILURE — call after a wrong password ─────────────────
export async function recordFailedAttempt(req: Request, email: string): Promise<void> {
  const ip         = req.ip ?? 'unknown';
  const normalEmail = email.toLowerCase().trim();

  // Account-level counter (ignores IP)
  const acctCount = await redis.incr(acctKey(normalEmail));
  if (acctCount === 1) await redis.expire(acctKey(normalEmail), WINDOW_SEC);
  if (acctCount >= MAX_ATTEMPTS) {
    await redis.set(acctLock(normalEmail), '1', 'EX', LOCKOUT_SEC);
    await redis.del(acctKey(normalEmail));
    await auditFromRequest(req, 'LOGIN_LOCKED', undefined, { email: normalEmail, triggeredBy: ip });
  }

  // IP-level counter (catches one IP trying many accounts)
  const IP_MAX     = 20;  // 20 failures from same IP within 5 min
  const ipCount    = await redis.incr(ipKey(ip));
  if (ipCount === 1) await redis.expire(ipKey(ip), WINDOW_SEC);
  if (ipCount >= IP_MAX) {
    await redis.set(`lock:ip:${ip}`, '1', 'EX', LOCKOUT_SEC);
    await redis.del(ipKey(ip));
  }

  await auditFromRequest(req, 'LOGIN_FAILED', undefined, { email: normalEmail, accountAttempts: acctCount });
}

// ── CLEAR — call after a successful login ────────────────────────
export async function clearFailedAttempts(req: Request, email: string): Promise<void> {
  const normalEmail = email.toLowerCase().trim();
  await redis.del(acctKey(normalEmail), acctLock(normalEmail));
  // Note: we intentionally keep the IP counter — legitimate login from a
  // suspicious IP doesn't reset the IP-level block for other accounts.
}