-- IMC Industriales — slug público para empresas
ALTER TABLE companies ADD COLUMN IF NOT EXISTS slug TEXT;
-- Aseguramos índice único (lo creamos como unique sólo si no existe).
CREATE UNIQUE INDEX IF NOT EXISTS companies_slug_unique ON companies(slug);
