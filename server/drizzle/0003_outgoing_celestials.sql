CREATE TABLE "auth_tokens" (
	"tokenHash" varchar(64) PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"purpose" varchar(16) NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"tokenHash" varchar(64) PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "categories" DROP CONSTRAINT "categories_name_unique";--> statement-breakpoint
ALTER TABLE "categories" DROP CONSTRAINT "categories_slug_unique";--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "userId" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "emailVerifiedAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auth_tokens_user_idx" ON "auth_tokens" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "auth_tokens_expiry_idx" ON "auth_tokens" USING btree ("expiresAt");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "sessions_expiry_idx" ON "sessions" USING btree ("expiresAt");--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "categories_user_name_idx" ON "categories" USING btree ("userId","name");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_user_slug_idx" ON "categories" USING btree ("userId","slug");
--> statement-breakpoint
-- Preserve existing account-owned snippets by cloning their formerly shared categories.
-- Unowned legacy data stays unowned; no public signup can claim it.
INSERT INTO "categories" ("name", "slug", "description", "color", "userId")
SELECT DISTINCT c."name", c."slug", c."description", c."color", s."userId"
FROM "categories" c JOIN "snippets" s ON s."categoryId" = c."id"
WHERE c."userId" IS NULL AND s."userId" IS NOT NULL
ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "snippets" s SET "categoryId" = owned."id"
FROM "categories" original JOIN "categories" owned
  ON original."slug" = owned."slug" AND original."userId" IS NULL
WHERE s."categoryId" = original."id" AND owned."userId" = s."userId";
--> statement-breakpoint
INSERT INTO "categories" ("name", "slug", "description", "color", "userId")
SELECT defaults.*, u."id" FROM "users" u CROSS JOIN (VALUES
  ('Code Snippet', 'code-snippet', 'Reusable functions, components, scripts, and examples.', '#d4ff00'),
  ('Command Snippet', 'command-snippet', 'Terminal commands and command sequences.', '#98f5ff'),
  ('Config', 'config', 'Project setup, environment, and configuration notes.', '#ffcf5a'),
  ('Note', 'note', 'Short technical notes and reminders.', '#f0f0f0')
) AS defaults("name", "slug", "description", "color") ON CONFLICT DO NOTHING;
