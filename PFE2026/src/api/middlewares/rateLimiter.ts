import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redisClient } from "../../infrastructure/redis";

export const otpSendLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many OTP requests. Please wait before retrying." },
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    prefix: "rl:otp_send:",
  }),
  keyGenerator: (req) => {
    const email = req.body?.email as string | undefined;
    return email ? `email:${email.toLowerCase()}` : req.ip ?? "unknown";
  },
});

export const otpVerifyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many verification attempts. Account temporarily locked." },
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    prefix: "rl:otp_verify:",
  }),
  keyGenerator: (req) => {
    const email = req.body?.email as string | undefined;
    return email ? `email:${email.toLowerCase()}` : req.ip ?? "unknown";
  },
});

export const generalApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Slow down." },
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    prefix: "rl:api:",
  }),
  keyGenerator: (req) => {
    const userId = (req as any).userId as string | undefined;
    return userId ? `user:${userId}` : req.ip ?? "unknown";
  },
  skip: (req) => req.path === "/health",
});

export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Chat rate limit reached. Please wait a moment." },
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    prefix: "rl:chat:",
  }),
  keyGenerator: (req) => {
    const userId = (req as any).userId as string | undefined;
    return userId ? `user:${userId}` : req.ip ?? "unknown";
  },
});

export const otpRateLimiter = otpSendLimiter;