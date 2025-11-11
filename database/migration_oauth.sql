-- Migration: Allow NULL password_hash for OAuth users
-- Run this if you already have the users table created

ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

