import { Request, Response, NextFunction } from "express";
import { redisClient } from "../../infrastructure/redis";
import { JwtService } from "../../core/services/JwtService";

const BLACKLIST_PREFIX = "blacklist:jti:";

export class TokenBlacklist {
  static async revoke(jti: string, expiresAt: number): Promise<void> {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const ttlSeconds = expiresAt - nowSeconds;
    if (ttlSeconds <= 0) return;
    await redisClient.set(`${BLACKLIST_PREFIX}${jti}`, "1", { EX: ttlSeconds });
  }

  static async isRevoked(jti: string): Promise<boolean> {
    const result = await redisClient.get(`${BLACKLIST_PREFIX}${jti}`);
    return result !== null;
  }
}

export async function tokenBlacklistMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing authorization header" });
    return;
  }

  const token = authHeader.slice(7);
  let payload: { jti?: string; exp?: number; sub?: string };

  try {
    payload = JwtService.staticVerify(token);
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  if (!payload.jti || !isUuidV4(payload.jti)) {
    res.status(401).json({ error: "Token missing valid jti claim" });
    return;
  }

  const revoked = await TokenBlacklist.isRevoked(payload.jti);
  if (revoked) {
    res.status(401).json({ error: "Token has been revoked" });
    return;
  }

  (req as any).jti = payload.jti;
  (req as any).userId = payload.sub;
  next();
}

function isUuidV4(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

// Compatibility shim — AuthController_2FA_PATCH imports blacklistToken(rawToken)
export async function blacklistToken(rawToken: string): Promise<void> {
  try {
    const decoded = JwtService.staticDecode(rawToken) as { jti?: string; exp?: number } | null;
    if (!decoded?.jti || !decoded?.exp) return;
    await TokenBlacklist.revoke(decoded.jti, decoded.exp);
  } catch {
    // never throw — blacklisting failure must not break logout
  }
}

export async function isBlacklisted(rawToken: string): Promise<boolean> {
  try {
    const decoded = JwtService.staticDecode(rawToken) as { jti?: string } | null;
    if (!decoded?.jti) return false;
    return TokenBlacklist.isRevoked(decoded.jti);
  } catch {
    return false;
  }
}

export async function rejectBlacklisted(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return next();
  const token = authHeader.split(" ")[1];
  if (await isBlacklisted(token)) {
    return res.status(401).json({ error: "Token has been revoked. Please log in again." });
  }
  next();
}