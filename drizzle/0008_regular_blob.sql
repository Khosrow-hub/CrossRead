CREATE TYPE "public"."pending_action" AS ENUM('create', 'update', 'delete');--> statement-breakpoint
ALTER TABLE "annotations" ADD COLUMN "pending_action" "pending_action";--> statement-breakpoint
CREATE INDEX "annotations_pending_action_idx" ON "annotations" USING btree ("project_id","pending_action");