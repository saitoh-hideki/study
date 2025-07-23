-- Clean up duplicate files in uploaded_files table
-- Keep the most recent file for each unique file name

-- First, let's see what duplicates we have
SELECT 
  file_name,
  COUNT(*) as count,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM uploaded_files 
GROUP BY file_name 
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- Delete duplicate files, keeping only the most recent one
DELETE FROM uploaded_files 
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY file_name 
             ORDER BY created_at DESC
           ) as rn
    FROM uploaded_files
  ) t
  WHERE t.rn > 1
);

-- Add a unique constraint to prevent future duplicates
-- (This will fail if there are still duplicates, so run the cleanup first)
ALTER TABLE uploaded_files 
ADD CONSTRAINT unique_file_name_per_user 
UNIQUE (user_id, file_name);

-- Show the final result
SELECT 
  file_name,
  COUNT(*) as count
FROM uploaded_files 
GROUP BY file_name 
ORDER BY file_name; 