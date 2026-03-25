CREATE TABLE IF NOT EXISTS "uploaded_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"blob_url" text NOT NULL,
	"file_type" text NOT NULL,
	"original_name" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"text_content" text,
	"tokens_used" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"error" text
);
