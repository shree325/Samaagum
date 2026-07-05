-- =====================================================================
-- Migration 915: Store PDF invoices in Database
-- =====================================================================

TRUNCATE TABLE invoices CASCADE;
ALTER TABLE invoices DROP COLUMN IF EXISTS pdf_path;
ALTER TABLE invoices ADD COLUMN pdf_data BYTEA NOT NULL;
