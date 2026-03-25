-- Migration: 0007_add_user_signer_type
-- Adds the signer_type enum and column to the users table (Issue #283)

CREATE TYPE "public"."signer_type" AS ENUM('Email', 'Passkey');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "signer_type" "signer_type" DEFAULT 'Email' NOT NULL;--> statement-breakpoint
