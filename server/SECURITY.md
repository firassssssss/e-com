# FYT API Security Overview

This document captures the current security posture of the FYT backend and tracks compliance with the **OWASP Mobile Top 10 (2023)** risks.  
It will be maintained as new features are introduced.

---

## 1. Security Controls Implemented

| Area | Control | Notes |
|------|---------|-------|
| Transport | **HTTPS-only** (enforced at ingress) | Handled by deployment infra (e.g., CloudFront / Nginx). |
| Headers | **Helmet** middleware | Sets HSTS, X-Content-Type-Options, Referrer-Policy, etc. |
| CORS | `cors` lib, strict origin list via **ENV** | Update `ALLOWED_ORIGINS` env var per environment. |
| Auth | **JWT (HS256)** access tokens, 30-day refresh tokens | Secret stored in Vault / ENV. |
| MFA | SMS OTP via Prelude, 5-min TTL | Rate-limited (5/hr/IP). |
| Rate limiting | `express-rate-limit` on OTP endpoints | Redis store can be swapped for multi-instance deployment. |
| Audit logging | **morgan** combined logs piped to stdout → centralized log stack. |
| Data access | Drizzle ORM with parameterised queries | Prevents SQL injection. |
| Input validation | `class-validator` decorators on all DTOs | Validates type, format & length. |
| Secrets | `.env` + container secrets; never checked into VCS | CI scans with Trivy/TruffleHog. |
| Error handling | Central handler hides stack traces in production | Sends generic messages to clients. |
| Dependency scanning | `npm audit`, Renovate bot scheduled | Fail CI on high/critical issues. |

---

## 2. OWASP Mobile Top 10 Compliance Checklist

| #  | Risk & Description | Mitigation in FYT | Status |
|----|--------------------|-------------------|--------|
| **M1** | *Improper Credential Usage* | Credentials stored as env secrets; no hard-coded keys. | ✅ |
| **M2** | *Insecure Communication* | HTTPS enforced; TLS 1.2+. | ✅ |
| **M3** | *Inadequate Authentication & Authorization* | Strong JWT, refresh-token rotation (planned), OTP MFA. | ✅ (rotation TODO) |
| **M4** | *Insufficient Cryptography* | HS256 JWT, bcrypt for eventual passwords, HTTPS. | ✅ |
| **M5** | *Insecure Authorization* | `authorizationChecker` enforces role auth; unit tests planned. | 🟡 (tests) |
| **M6** | *Client Code Quality* | N/A (backend) but API defends against malformed input. | ✅ |
| **M7** | *Code Tampering* | JWT signed; server code immutably built & signed in CI. | ✅ |
| **M8** | *Reverse Engineering* | N/A (backend). | ✅ |
| **M9** | *Insecure Data Storage* | PII encrypted at rest (DB volume-level), hashes not raw pwd. | ✅ |
| **M10** | *Privacy Violations* | GDPR-compatible data minimization, logging redaction planned. | 🟡 (redaction) |

Legend: ✅ Compliant 🟡 Partial / Planned ❌ Not addressed

> **Next Actions**
>
> 1. Implement refresh-token rotation & revocation (closes M3 gap).
> 2. Add authorization unit/integration tests (closes M5 gap).
> 3. Central log redaction of PII before export (closes M10 gap).

---

## 3. Security Audit Preparation

1. **Documentation** – Architecture diagram, threat model, and this `SECURITY.md`.
2. **Automated Tests** – Include auth/authorization integration tests.
3. **Tools** – Run OWASP ZAP / Burp scan against staging.
4. **Pen-Test** – Schedule external pentest post-MVP.

---

_Last updated: 2025-06-16_
