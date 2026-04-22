# Security Architecture

## Authentication
- Argon2id password hashing (PHC winner)
- TOTP/2FA enforcement
- JWT with Redis-backed token blacklist
- Brute force protection (account lockout)

## Transport
- mTLS between Node.js API and Python RAG service
- Helmet security headers (HSTS, X-Frame-Options, CSP)
- Rate limiting (volumetric) + brute force (behavioral)

## Application
- SSRF guard middleware
- Prompt injection filter (LLM-specific threat)
- Input sanitization middleware
- Service-to-service authentication layer

## Observability
- Per-request audit logging
- Scoped request context for security event tracing
- Error handler prevents stack trace leakage

## Known Tradeoff
- JWT stored in localStorage (XSS surface) — production
  deployment would migrate to httpOnly cookies.
