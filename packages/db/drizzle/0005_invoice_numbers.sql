CREATE TABLE "invoice_number_counters" (
	"year" integer PRIMARY KEY NOT NULL,
	"last" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "number" text;--> statement-breakpoint
-- Backfill any pre-existing invoices deterministically (per-year, by creation order).
WITH ordered AS (
	SELECT
		id,
		EXTRACT(YEAR FROM created_at)::int AS yr,
		ROW_NUMBER() OVER (
			PARTITION BY EXTRACT(YEAR FROM created_at)
			ORDER BY created_at, id
		) AS seq
	FROM "invoices"
	WHERE "number" IS NULL
)
UPDATE "invoices" i
SET "number" = 'INV-' || o.yr || '-' || LPAD(o.seq::text, 4, '0')
FROM ordered o
WHERE i.id = o.id;
--> statement-breakpoint
-- Seed the per-year counters so new invoices continue after the backfilled max.
INSERT INTO "invoice_number_counters" ("year", "last")
SELECT EXTRACT(YEAR FROM created_at)::int, COUNT(*)::int
FROM "invoices"
GROUP BY EXTRACT(YEAR FROM created_at)
ON CONFLICT ("year") DO UPDATE SET "last" = excluded."last";
--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "number" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_number_unique" UNIQUE("number");
