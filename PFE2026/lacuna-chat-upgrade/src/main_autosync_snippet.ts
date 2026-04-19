// main.ts — RAG AUTO-SYNC MIDDLEWARE
// LACUNA PFE 2026
// =====================================================
// Add this block to your existing main.ts BEFORE the
// routing-controllers setup.
// Watches all product mutations and triggers RAG /sync
// automatically after a successful response — caller never waits.
//
// PASTE THIS into src/main.ts after app is created:

import axios from "axios";

const RAG_SERVICE_URL = process.env.RAG_URL || "http://localhost:8001";

app.use("/api/products", (req, _res, next) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    _res.on("finish", () => {
      if (_res.statusCode < 400) {
        axios
          .post(
            `${RAG_SERVICE_URL}/sync`,
            {},
            {
              timeout: 120_000,
              headers: {
                Authorization: `Bearer ${process.env.RASA_SERVICE_TOKEN ?? ""}`,
              },
            }
          )
          .then(() => console.log("[RAG] Auto-sync triggered"))
          .catch((err: Error) =>
            console.warn("[RAG] Auto-sync failed:", err.message)
          );
      }
    });
  }
  next();
});

// Also register chat routes in your router:
//
// import { sendMessage }    from "./api/controllers/ChatController";
// import { submitFeedback } from "./api/controllers/ChatFeedbackController";
// import { serviceAuthMiddleware } from "./api/middlewares/serviceAuthMiddleware";
//
// app.post("/api/chat/message",  sendMessage);
// app.post("/api/chat/feedback", submitFeedback);
// app.get("/api/products/internal", serviceAuthMiddleware, internalProductsHandler);
