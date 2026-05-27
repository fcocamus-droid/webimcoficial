-- IMC Industriales — Marketplace B2B schema

-- Enums
CREATE TYPE "StockStatus" AS ENUM ('DISPONIBLE', 'A_PEDIDO', 'AGOTADO');
CREATE TYPE "ProductOrigin" AS ENUM ('CHILE', 'CHINA', 'USA', 'EUROPA', 'LATAM', 'OTRO');
CREATE TYPE "RfqStatus" AS ENUM ('OPEN', 'RESPONDED', 'CLOSED', 'CANCELLED');
CREATE TYPE "RfqVisibility" AS ENUM ('PUBLIC', 'TARGETED');
CREATE TYPE "CertificationType" AS ENUM ('ISO_9001', 'ISO_14001', 'HACCP', 'BPM', 'GMP', 'KOSHER', 'ORGANICO', 'FDA', 'OTRA');

-- Companies
CREATE TABLE companies (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "razonSocial" TEXT NOT NULL,
  rut TEXT UNIQUE NOT NULL,
  giro TEXT,
  description TEXT,
  "logoUrl" TEXT,
  "bannerUrl" TEXT,
  "websiteUrl" TEXT,
  "isSeller" BOOLEAN DEFAULT false,
  "isBuyer" BOOLEAN DEFAULT true,
  "contactEmail" TEXT,
  "contactPhone" TEXT,
  address TEXT,
  comuna TEXT,
  region TEXT,
  ciudad TEXT,
  verified BOOLEAN DEFAULT false,
  "verifiedAt" TIMESTAMP,
  "ratingAverage" DOUBLE PRECISION,
  "ratingCount" INT DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_companies_user ON companies("userId");
CREATE INDEX idx_companies_verified ON companies(verified);
CREATE INDEX idx_companies_seller ON companies("isSeller") WHERE "isSeller" = true;

-- Certifications
CREATE TABLE company_certifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "companyId" TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type "CertificationType" NOT NULL,
  "customName" TEXT,
  "fileUrl" TEXT,
  "expiresAt" TIMESTAMP,
  verified BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_cert_company ON company_certifications("companyId");

-- Categories (hierarchical)
CREATE TABLE categories (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  "parentId" TEXT REFERENCES categories(id),
  "sortOrder" INT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_categories_parent ON categories("parentId");

-- Seed categories
INSERT INTO categories (slug, name, description, icon, "sortOrder") VALUES
  ('quimicos', 'Químicos industriales', 'Soda cáustica, ácidos, solventes, cloro, tratamiento de aguas', '⚗️', 1),
  ('cosmetica', 'Cosmética y cuidado personal', 'Bases, fragancias, activos, ingredientes shampoo y cremas', '🧴', 2),
  ('limpieza', 'Limpieza industrial', 'Detergentes, desinfectantes, aseo edificios y oficinas', '🧽', 3),
  ('alimentos', 'Alimentos y food service', 'Insumos cafetería, quesos, salsas, abarrotes', '🍽️', 4),
  ('suplementos', 'Suplementos y farmacéutica', 'Proteínas, vitaminas, ingredientes farmacéuticos', '💊', 5),
  ('packaging', 'Envases y packaging', 'PET, doypack, envases cosméticos, etiquetas, biodegradable', '📦', 6);

-- Products
CREATE TABLE products (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  slug TEXT UNIQUE NOT NULL,
  "companyId" TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  "categoryId" TEXT REFERENCES categories(id),
  title TEXT NOT NULL,
  description TEXT,
  "shortDescription" TEXT,
  sku TEXT,
  brand TEXT,
  moq INT DEFAULT 1,
  unit TEXT DEFAULT 'unidad',
  "leadTimeDays" INT,
  "stockStatus" "StockStatus" DEFAULT 'DISPONIBLE',
  origin "ProductOrigin" DEFAULT 'CHILE',
  "basePriceCLP" DOUBLE PRECISION,
  currency TEXT DEFAULT 'CLP',
  available BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  specs JSONB,
  "viewCount" INT DEFAULT 0,
  "rfqCount" INT DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_company ON products("companyId");
CREATE INDEX idx_products_category ON products("categoryId");
CREATE INDEX idx_products_available ON products(available) WHERE available = true;

-- Product images
CREATE TABLE product_images (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "productId" TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt TEXT,
  "isPrimary" BOOLEAN DEFAULT false,
  "sortOrder" INT DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_product_images_product ON product_images("productId");

-- Pricing tiers
CREATE TABLE pricing_tiers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "productId" TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  "minQuantity" INT NOT NULL,
  "priceCLP" DOUBLE PRECISION NOT NULL,
  currency TEXT DEFAULT 'CLP',
  label TEXT
);
CREATE INDEX idx_pricing_tiers_product ON pricing_tiers("productId");

-- RFQs
CREATE TABLE rfqs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  number TEXT UNIQUE NOT NULL,
  "buyerId" TEXT NOT NULL REFERENCES users(id),
  "productId" TEXT REFERENCES products(id),
  "categoryId" TEXT REFERENCES categories(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity INT NOT NULL,
  unit TEXT DEFAULT 'unidad',
  "budgetMaxCLP" DOUBLE PRECISION,
  "deliveryDeadline" TIMESTAMP,
  "deliveryLocation" TEXT,
  visibility "RfqVisibility" DEFAULT 'PUBLIC',
  status "RfqStatus" DEFAULT 'OPEN',
  "expiresAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_rfqs_buyer ON rfqs("buyerId");
CREATE INDEX idx_rfqs_status ON rfqs(status);

-- RFQ responses
CREATE TABLE rfq_responses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "rfqId" TEXT NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  "sellerCompanyId" TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  "pricePerUnit" DOUBLE PRECISION NOT NULL,
  "totalPrice" DOUBLE PRECISION NOT NULL,
  "leadTimeDays" INT,
  notes TEXT,
  "attachmentUrl" TEXT,
  status TEXT DEFAULT 'SENT',
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE("rfqId", "sellerCompanyId")
);
CREATE INDEX idx_rfq_resp_seller ON rfq_responses("sellerCompanyId");

-- Messages
CREATE TABLE messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "rfqId" TEXT REFERENCES rfqs(id) ON DELETE CASCADE,
  "fromUserId" TEXT NOT NULL REFERENCES users(id),
  "toUserId" TEXT NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  attachments JSONB,
  "readAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_messages_from ON messages("fromUserId");
CREATE INDEX idx_messages_to ON messages("toUserId");

-- Favorites
CREATE TABLE favorites (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "productId" TEXT REFERENCES products(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE("userId", "productId")
);
CREATE INDEX idx_favorites_user ON favorites("userId");

-- Reviews
CREATE TABLE reviews (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "fromUserId" TEXT NOT NULL REFERENCES users(id),
  "toCompanyId" TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  "rfqId" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_reviews_company ON reviews("toCompanyId");
