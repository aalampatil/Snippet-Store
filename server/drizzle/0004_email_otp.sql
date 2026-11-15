CREATE TABLE "email_challenges" (
	"email" varchar(255) NOT NULL,
	"purpose" varchar(16) NOT NULL,
	"challengeHash" varchar(64),
	"codeHash" varchar(64),
	"expiresAt" timestamp with time zone,
	"attempts" integer DEFAULT 0 NOT NULL,
	"sentAt" timestamp with time zone,
	"requestCount" integer DEFAULT 0 NOT NULL,
	"windowStartedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_challenges_email_purpose_pk" PRIMARY KEY("email","purpose")
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "passwordHash" DROP NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "email_challenges_hash_idx" ON "email_challenges" USING btree ("challengeHash");--> statement-breakpoint
CREATE INDEX "email_challenges_window_idx" ON "email_challenges" USING btree ("windowStartedAt");