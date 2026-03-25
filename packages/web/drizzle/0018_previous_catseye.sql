CREATE TABLE IF NOT EXISTS "tier_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"tier_name" text NOT NULL,
	"max_tokens" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tier_config_tier_name_unique" UNIQUE("tier_name")
);
--> statement-breakpoint
ALTER TABLE "user_usage" ADD COLUMN "tier" text DEFAULT 'free' NOT NULL;