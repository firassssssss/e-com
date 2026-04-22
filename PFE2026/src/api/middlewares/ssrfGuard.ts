import { Request, Response, NextFunction } from "express";
import dns from "dns/promises";
import https from "https";

const HOSTNAME_ALLOWLIST = new Set<string>(
  (process.env.SSRF_ALLOWED_HOSTS ?? "").split(",").map(h => h.trim()).filter(Boolean)
);

const PRIVATE_CIDR_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/,
  /^fd[0-9a-f]{2}:/,
  /^fe80:/,
  /^0\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
];

function isPrivateIp(ip: string): boolean {
  return PRIVATE_CIDR_PATTERNS.some(p => p.test(ip));
}

export async function validateHostAtConnectionTime(hostname: string): Promise<void> {
  let addresses: string[];
  try {
    addresses = await dns.resolve(hostname);
  } catch {
    try {
      addresses = await dns.resolve4(hostname);
    } catch {
      throw new Error(`SSRF: DNS resolution failed for hostname: ${hostname}`);
    }
  }
  if (addresses.length === 0) throw new Error(`SSRF: No DNS records for: ${hostname}`);
  for (const ip of addresses) {
    if (isPrivateIp(ip)) throw new Error(`SSRF: ${hostname} resolved to private IP ${ip}`);
  }
}

export function createSafeAgent(): https.Agent {
  return new https.Agent({
    lookup: async (hostname, options, callback) => {
      try {
        await validateHostAtConnectionTime(hostname);
        const { lookup } = await import("dns");
        lookup(hostname, options, callback);
      } catch (err) {
        callback(err as Error, "", 4);
      }
    },
  });
}

export function ssrfGuard(urlField: string = "url") {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const rawUrl: string | undefined =
      (req.body?.[urlField] as string) ?? (req.query?.[urlField] as string);
    if (!rawUrl) { next(); return; }

    let parsed: URL;
    try { parsed = new URL(rawUrl); } catch {
      res.status(400).json({ error: "Invalid URL format" }); return;
    }

    if (parsed.protocol !== "https:") {
      res.status(400).json({ error: "Only HTTPS URLs are allowed" }); return;
    }

    if (HOSTNAME_ALLOWLIST.size > 0 && !HOSTNAME_ALLOWLIST.has(parsed.hostname)) {
      res.status(400).json({ error: "URL hostname is not in the allowed list" }); return;
    }

    try {
      await validateHostAtConnectionTime(parsed.hostname);
    } catch {
      res.status(400).json({ error: "URL resolves to a disallowed address" }); return;
    }

    next();
  };
}

export async function safeFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:") throw new Error("SSRF: Only HTTPS requests are allowed");
  await validateHostAtConnectionTime(parsed.hostname);
  return fetch(url, options);
}

export async function isSafeURL(rawUrl: string): Promise<boolean> {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:") return false;
    await validateHostAtConnectionTime(parsed.hostname);
    return true;
  } catch {
    return false;
  }
}