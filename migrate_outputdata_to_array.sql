-- Migration: Change outputData from JSONB to TEXT[] (String array)
-- This allows storing image URLs directly as an array instead of JSON

-- Step 1: Add new column with array type
ALTER TABLE "Job" ADD COLUMN "outputData_new" TEXT[] DEFAULT '{}';

-- Step 2: Migrate existing data
-- Convert JSONB to array if it contains an "images" property
UPDATE "Job"
SET "outputData_new" = CASE
  -- If outputData is already an array, extract it
  WHEN jsonb_typeof("outputData") = 'array' THEN
    ARRAY(SELECT jsonb_array_elements_text("outputData"))
  -- If outputData has an 'images' property that's an array
  WHEN "outputData" ? 'images' AND jsonb_typeof("outputData"->'images') = 'array' THEN
    ARRAY(SELECT jsonb_array_elements_text("outputData"->'images'))
  -- Otherwise, empty array
  ELSE '{}'
END
WHERE "outputData" IS NOT NULL;

-- Step 3: Drop old column
ALTER TABLE "Job" DROP COLUMN "outputData";

-- Step 4: Rename new column to outputData
ALTER TABLE "Job" RENAME COLUMN "outputData_new" TO "outputData";

-- Step 5: Set NOT NULL constraint with default empty array
ALTER TABLE "Job" ALTER COLUMN "outputData" SET DEFAULT '{}';
ALTER TABLE "Job" ALTER COLUMN "outputData" SET NOT NULL;

-- Verify the migration
SELECT id, "inputImages", "outputData", status
FROM "Job"
WHERE "outputData" IS NOT NULL AND array_length("outputData", 1) > 0
LIMIT 5;
