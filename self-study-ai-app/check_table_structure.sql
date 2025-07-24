-- Check table structure for messages and sessions
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('messages', 'sessions', 'reviews')
ORDER BY table_name, ordinal_position; 