-- IMC Industriales — Agrega SUPERADMIN y SALES_AGENT al enum UserRole
-- y columnas createdById + active a la tabla users (para gestionar agentes).

-- Postgres no permite ADD VALUE dentro de una transacción con CHECK,
-- pero sí permite IF NOT EXISTS desde Postgres 12.
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SUPERADMIN';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SALES_AGENT';

-- Columnas para gestionar agentes de ventas
ALTER TABLE users ADD COLUMN IF NOT EXISTS "createdById" TEXT
  REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_users_created_by ON users("createdById");
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
