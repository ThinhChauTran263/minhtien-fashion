-- Enable pg_trgm extension for fuzzy/similarity search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN index trên Product.name cho tìm kiếm nhanh (trigram)
CREATE INDEX "Product_name_trgm_idx" ON "Product" USING GIN ("name" gin_trgm_ops);

-- GIN index trên Product.shortDesc (nếu có) cho search mở rộng
CREATE INDEX "Product_shortDesc_trgm_idx" ON "Product" USING GIN ("shortDesc" gin_trgm_ops)
  WHERE "shortDesc" IS NOT NULL;
