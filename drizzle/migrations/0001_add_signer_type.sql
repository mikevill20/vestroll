-- Migration: 0001_add_signer_type
-- Adds the signer_type enum and column to the users table (Issue #283)

CREATE TYPE "public"."signer_type" AS ENUM('Email', 'Passkey');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "signer_type" "signer_type";
