CREATE INDEX "categories_name_idx" ON "categories" USING btree ("name");--> statement-breakpoint
CREATE INDEX "snippets_category_id_idx" ON "snippets" USING btree ("categoryId");--> statement-breakpoint
CREATE INDEX "snippets_updated_at_idx" ON "snippets" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "snippets_title_idx" ON "snippets" USING btree ("title");--> statement-breakpoint
CREATE INDEX "snippets_language_idx" ON "snippets" USING btree ("language");--> statement-breakpoint
CREATE INDEX "snippets_project_idx" ON "snippets" USING btree ("project");