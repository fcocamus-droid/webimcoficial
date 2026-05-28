-- IMC Industriales — campo de ficha técnica (PDF) en productos
ALTER TABLE products ADD COLUMN IF NOT EXISTS "datasheetUrl" TEXT;
