ALTER TABLE "books" ADD COLUMN "ol_key" text;--> statement-breakpoint
CREATE UNIQUE INDEX "books_ol_key_idx" ON "books" USING btree ("ol_key");