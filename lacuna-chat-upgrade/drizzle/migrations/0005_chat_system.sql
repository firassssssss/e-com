-- drizzle/migrations/0005_chat_system.sql
-- LACUNA PFE 2026 — conversation logging + feedback tables
-- Run: npx drizzle-kit push  OR  psql $DATABASE_URL -f this_file.sql

CREATE TABLE IF NOT EXISTS conversation_logs (
    id           TEXT         PRIMARY KEY DEFAULT gen_random_uuid()::text,
    session_id   TEXT         NOT NULL,
    user_id      TEXT         REFERENCES users(id) ON DELETE SET NULL,
    user_message TEXT         NOT NULL,
    bot_messages JSONB        NOT NULL DEFAULT '[]',
    intent       TEXT,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conv_logs_session ON conversation_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_conv_logs_user    ON conversation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_conv_logs_created ON conversation_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS chat_feedback (
    id         TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    log_id     TEXT        NOT NULL REFERENCES conversation_logs(id) ON DELETE CASCADE,
    session_id TEXT        NOT NULL,
    rating     SMALLINT    NOT NULL CHECK (rating IN (1, -1)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_log_id  ON chat_feedback(log_id);
CREATE INDEX IF NOT EXISTS idx_feedback_session ON chat_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON chat_feedback(created_at DESC);
