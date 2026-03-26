CREATE TABLE "passkey_registration_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"challenge_hash" varchar(64) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "passkey_registration_challenges_challenge_hash_unique" UNIQUE("challenge_hash")
);
--> statement-breakpoint
ALTER TABLE "passkey_registration_challenges" ADD CONSTRAINT "passkey_registration_challenges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "passkey_registration_challenges_user_id_idx" ON "passkey_registration_challenges" USING btree ("user_id");
