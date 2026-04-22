import helmet from "helmet";
import crypto from "crypto";
import { Request, Response, NextFunction } from "express";

export function cspNonceMiddleware(req: Request, res: Response, next: NextFunction): void {
  res.locals.cspNonce = crypto.randomBytes(16).toString("base64");
  next();
}

export function helmetConfig() {
  return helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'none'"],
        scriptSrc: [
          "'self'",
          (_req: Request, res: Response) => `'nonce-${res.locals.cspNonce}'`,
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          (_req: Request, res: Response) => `'nonce-${res.locals.cspNonce}'`,
        ],
        imgSrc: ["'self'", "data:", "blob:", "https://firebasestorage.googleapis.com"].filter(Boolean),
        connectSrc: ["'self'", process.env.API_BASE_URL ?? ""].filter(Boolean),
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: { maxAge: 31_536_000, includeSubDomains: true, preload: true },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xContentTypeOptions: true,
    xDnsPrefetchControl: { allow: false },
    xDownloadOptions: true,
    xFrameOptions: false,
    hidePoweredBy: true,
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "same-origin" },
  });
}