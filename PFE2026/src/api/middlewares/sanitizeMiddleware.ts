/**
 * sanitizeMiddleware.ts
 *
 * ROLE IN XSS DEFENCE:
 *   XSS is primarily an OUTPUT-ENCODING problem.
 *   This middleware is Layer 1 (input sanitization) in a two-layer defence:
 *
 *   Layer 1 — THIS FILE: strips HTML from incoming request bodies and query params
 *             before data reaches the database. Reduces blast radius if output
 *             encoding fails elsewhere. Does NOT replace output encoding.
 *
 *   Layer 2 — React / Next.js (frontend): HTML-encodes all dynamic values by
 *             default via JSX expression binding. This is the primary XSS
 *             prevention mechanism.
 *
 * OWASP MAPPING: A03 — Injection (XSS sub-category)
 *
 * COVERAGE:
 *   - allowedTags: []          → zero HTML survives (strictest possible)
 *   - allowedAttributes: {}    → zero attributes survive
 *   - deepSanitize()           → handles nested objects {address: {line1: '<script>'}}
 *   - Applied GLOBALLY as first middleware in main.ts
 *
 * NOTE ON WAF:
 *   A WAF is a network-level control. It cannot inspect JSON bodies inside
 *   TLS-encrypted traffic. This middleware runs post-parsing, post-TLS, and
 *   handles deeply nested objects that no network-layer WAF can inspect.
 */

import { Request, Response, NextFunction } from "express";
import sanitizeHtml from "sanitize-html";

function deepSanitize(value: unknown): unknown {
  if (typeof value === "string") {
    return sanitizeHtml(value, {
      allowedTags: [],
      allowedAttributes: {},
    }).trim();
  }

  if (Array.isArray(value)) {
    return value.map(deepSanitize);
  }

  if (value !== null && typeof value === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      sanitized[key] = deepSanitize(val);
    }
    return sanitized;
  }

  // Numbers, booleans, null pass through untouched
  return value;
}

export function sanitizeMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (req.body) {
    req.body = deepSanitize(req.body);
  }

  if (req.query) {
    const sanitized = deepSanitize(req.query) as Record<string, any>;
    for (const key of Object.keys(sanitized)) {
      (req.query as Record<string, any>)[key] = sanitized[key];
    }
  }

  next();
}

