-- Migration: Change outputData from JSONB to TEXT[] (String array)
-- Safe migration with proper data conversion

-- Step 1: Add temporary column with TEXT[] type
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "outputData_temp" TEXT[];

-- Step 2: Migrate existing data with proper JSON parsing
UPDATE "Job"
SET "outputData_temp" = CASE
  -- If outputData is NULL, set empty array
  WHEN "outputData" IS NULL THEN '{}'
  -- If outputData is a JSON array, convert each element to text
  WHEN jsonb_typeof("outputData") = 'array' THEN
    (SELECT array_agg(value::text)
     FROM jsonb_array_elements_text("outputData"))
  -- If outputData is a JSON object with 'images' array property
  WHEN "outputData" ? 'images' AND jsonb_typeof("outputData"->'images') = 'array' THEN
    (SELECT array_agg(value::text)
     FROM jsonb_array_elements_text("outputData"->'images'))
  -- Otherwise, empty array
  ELSE '{}'
END;

-- Step 3: Drop the old outputData column
ALTER TABLE "Job" DROP COLUMN "outputData";

-- Step 4: Rename temp column to outputData
ALTER TABLE "Job" RENAME COLUMN "outputData_temp" TO "outputData";

-- Step 5: Set default and NOT NULL constraint
ALTER TABLE "Job" ALTER COLUMN "outputData" SET DEFAULT '{}';
ALTER TABLE "Job" ALTER COLUMN "outputData" SET NOT NULL;

-- Step 6: Verify migration (optional)
-- SELECT id, status, array_length("inputImages", 1) as input_count,
--        array_length("outputData", 1) as output_count
-- FROM "Job"
-- WHERE status = 'completed'
-- LIMIT 10;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully! outputData is now TEXT[]';
END $$;
