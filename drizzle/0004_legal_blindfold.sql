ALTER TABLE "projects" ADD COLUMN "forked_from_id" uuid;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_forked_from_id_projects_id_fk" FOREIGN KEY ("forked_from_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "projects_forked_from_idx" ON "projects" USING btree ("forked_from_id");