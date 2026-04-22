// src/infrastructure/security/auditLogger.ts
// DROP IN: src/infrastructure/security/auditLogger.ts
// PURPOSE: Immutable audit trail for all security-sensitive events
// REQUIRES: your existing db client from src/infrastructure/db/index.ts
//
// ALSO CREATE this table in a new migration:
// ──────────────────────────────────────────
// CREATE TABLE audit_logs (
//   id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   event       TEXT NOT NULL,
//   user_id     TEXT,
//   ip          TEXT,
//   user_agent  TEXT,
//   metadata    JSONB,
//   created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
// );
// CREATE INDEX idx_audit_user  ON audit_logs(user_id);
// CREATE INDEX idx_audit_event ON audit_logs(event);
// ──────────────────────────────────────────

import { db } from '../db/index'; // your existing drizzle db client
import { pgTable, uuid, text, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ─── Drizzle schema (add this to src/infrastructure/db/schema/auditLogs.ts) ──
export const auditLogs = pgTable('audit_logs', {
  id:        uuid('id').defaultRandom().primaryKey(),
  event:     text('event').notNull(),
  userId:    text('user_id'),
  ip:        text('ip'),
  userAgent: text('user_agent'),
  metadata:  jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Supported audit event types ────────────────────────────────────────────
export type AuditEvent =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGIN_LOCKED'
  | 'LOGOUT'
  | 'REGISTER'
  | '2FA_SENT'
  | '2FA_VERIFIED'
  | '2FA_FAILED'
  | 'PASSWORD_CHANGED'
  | 'TOKEN_REVOKED'
  | 'ROLE_CHANGED'
  | 'USER_SUSPENDED'
  | 'USER_DELETED'
  | 'ADMIN_ACTION'
  | 'UNAUTHORIZED_ACCESS';

interface AuditPayload {
  event:     AuditEvent;
  userId?:   string;
  ip?:       string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

// ─── Main logger function ─────────────────────────────────────────────────────
export async function auditLog(payload: AuditPayload): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      event:     payload.event,
      userId:    payload.userId    ?? null,
      ip:        payload.ip        ?? null,
      userAgent: payload.userAgent ?? null,
      metadata:  payload.metadata  ?? null,
    });
  } catch (err) {
    // Never throw — logging must not break the main request flow
    console.error('[AuditLogger] Failed to write audit log:', err);
  }
}

// ─── Express helper — extracts ip + user-agent from request ─────────────────
import { Request } from 'express';

export function auditFromRequest(
  req:     Request,
  event:   AuditEvent,
  userId?: string,
  extra?:  Record<string, unknown>,
) {
  return auditLog({
    event,
    userId,
    ip:        req.ip ?? undefined,
    userAgent: req.headers['user-agent'] ?? undefined,
    metadata:  extra,
  });
}

// ─── HOW TO USE in AuthController.ts ─────────────────────────────────────────
//
//  import { auditFromRequest } from '../../infrastructure/security/auditLogger';
//
//  // On successful login:
//  await auditFromRequest(req, 'LOGIN_SUCCESS', user.id);
//
//  // On failed login:
//  await auditFromRequest(req, 'LOGIN_FAILED', undefined, { email: body.email });
//
//  // On role change (AdminController):
//  await auditFromRequest(req, 'ROLE_CHANGED', targetUserId, {
//    changedBy: adminId,
//    oldRole:   oldRole,
//    newRole:   newRole,
//  });
//
//  // On 2FA sent:
//  await auditFromRequest(req, '2FA_SENT', user.id);