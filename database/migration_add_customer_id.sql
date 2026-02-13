-- Migration: Add customer_id to documents table for multi-tenant support
-- Run this migration to add customer_id column to documents table

ALTER TABLE documents 
ADD COLUMN customer_id VARCHAR(255);

CREATE INDEX idx_documents_customer_id ON documents(customer_id);

-- Add comment
COMMENT ON COLUMN documents.customer_id IS 'Customer ID for multi-tenant scenarios (e.g., clinic_id for medical software)';

