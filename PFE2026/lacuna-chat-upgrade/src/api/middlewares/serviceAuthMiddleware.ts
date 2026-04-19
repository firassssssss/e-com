// src/api/middlewares/serviceAuthMiddleware.ts
// LACUNA PFE 2026 — M2M auth between Express and RAG service
// Applied to internal product-reading endpoints only — NOT on /api/chat/*

import { Request, Response, NextFunction } from "express";

export function serviceAuthMiddleware(
  req:  Request,
  res:  Response,
  next: NextFunction
): void {
  const authHeader = req.headers["authorization"] ?? "";
  const provided   = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";

  const expected = process.env.RASA_SERVICE_TOKEN ?? "";

  if (!expected) {
    // Missing env var = server misconfiguration — fail loudly
    res.status(500).json({ error: "Server misconfiguration: service token not configured." });
    return;
  }

  if (!provided || provided !== expected) {
    res.status(401).json({ error: "Invalid or missing service token." });
    return;
  }

  next();
}

// ── Usage in main.ts or router ────────────────────────────────────────────────
// import { serviceAuthMiddleware } from "./middlewares/serviceAuthMiddleware";
// app.get("/api/products/internal", serviceAuthMiddleware, productHandler);
//
// Generate token:
// node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
// Set same value in Express .env AND rag/.env as RASA_SERVICE_TOKEN
