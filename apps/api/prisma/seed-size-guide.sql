INSERT INTO "SizeGuide" ("id", "categoryId", "data", "createdAt", "updatedAt")
SELECT
  'default-size-guide',
  NULL,
  '{"S":{"chest":96,"length":68,"shoulder":42,"weight":"50-58kg","height":"160-165cm"},"M":{"chest":100,"length":70,"shoulder":44,"weight":"58-65kg","height":"165-170cm"},"L":{"chest":104,"length":72,"shoulder":46,"weight":"65-72kg","height":"170-175cm"},"XL":{"chest":108,"length":74,"shoulder":48,"weight":"72-80kg","height":"175-180cm"},"XXL":{"chest":112,"length":76,"shoulder":50,"weight":"80-90kg","height":"180-185cm"}}'::jsonb,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "SizeGuide" WHERE "categoryId" IS NULL);
