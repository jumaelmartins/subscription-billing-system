CREATE TABLE "email_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"to" text NOT NULL,
	"subject" text NOT NULL,
	"body" text,
	"status" text DEFAULT 'sent' NOT NULL,
	"event_type" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
