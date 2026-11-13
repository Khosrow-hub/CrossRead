ALTER TYPE "public"."notification_type" ADD VALUE 'comment_received';--> statement-breakpoint
ALTER TABLE "suggestion_comments" RENAME TO "annotation_comments";--> statement-breakpoint
ALTER TABLE "annotation_comments" RENAME COLUMN "suggestion_id" TO "annotation_id";--> statement-breakpoint
ALTER TABLE "annotation_comments" DROP CONSTRAINT "suggestion_comments_suggestion_id_suggestions_id_fk";
--> statement-breakpoint
ALTER TABLE "annotation_comments" DROP CONSTRAINT "suggestion_comments_author_id_users_id_fk";
--> statement-breakpoint
DROP INDEX "suggestion_comments_suggestion_idx";--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "annotation_id" uuid;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_annotation_id_annotations_id_fk" FOREIGN KEY ("annotation_id") REFERENCES "public"."annotations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "annotation_comments" ADD CONSTRAINT "annotation_comments_annotation_id_annotations_id_fk" FOREIGN KEY ("annotation_id") REFERENCES "public"."annotations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "annotation_comments" ADD CONSTRAINT "annotation_comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "annotation_comments_annotation_idx" ON "annotation_comments" USING btree ("annotation_id");