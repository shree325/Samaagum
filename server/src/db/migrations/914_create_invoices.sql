-- =====================================================================
-- Migration 914: Create Invoices Table
-- =====================================================================

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  order_id UUID NOT NULL UNIQUE REFERENCES subscription_orders(id) ON DELETE CASCADE,
  pdf_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoices_order ON invoices(order_id);
