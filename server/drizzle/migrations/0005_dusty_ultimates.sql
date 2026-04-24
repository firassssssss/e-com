CREATE TABLE "conversation_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"user_id" text,
	"user_message" text NOT NULL,
	"bot_messages" jsonb NOT NULL,
	"intent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"log_id" text NOT NULL,
	"session_id" text NOT NULL,
	"rating" smallint NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "skin_type" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "hair_type" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "skin_concerns" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "discovery_source" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "onboarding_done" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_feedback" ADD CONSTRAINT "chat_feedback_log_id_conversation_logs_id_fk" FOREIGN KEY ("log_id") REFERENCES "public"."conversation_logs"("id") ON DELETE cascade ON UPDATE no action;