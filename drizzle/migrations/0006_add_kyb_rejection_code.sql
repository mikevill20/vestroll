-- Add rejection_code column to kyb_verifications table
ALTER TABLE "kyb_verifications" ADD COLUMN "rejection_code" varchar(100);
