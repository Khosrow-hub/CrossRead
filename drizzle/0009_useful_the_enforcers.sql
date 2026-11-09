ALTER TABLE "annotations" ADD COLUMN "start_offset" integer;--> statement-breakpoint
ALTER TABLE "annotations" ADD COLUMN "end_offset" integer;--> statement-breakpoint
ALTER TABLE "annotations" ADD COLUMN "selected_text" text;