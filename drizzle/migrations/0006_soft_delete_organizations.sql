-- Soft Delete: Add deleted_at column to organizations table
ALTER TABLE "organizations" ADD COLUMN "deleted_at" timestamp;
