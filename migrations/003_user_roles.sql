-- User roles
-- Run: psql $DATABASE_URL -f migrations/003_user_roles.sql

ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user';
