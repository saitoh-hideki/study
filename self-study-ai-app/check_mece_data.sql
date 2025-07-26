-- MECEデータの存在確認
SELECT 
    id,
    user_id,
    theme,
    created_at,
    jsonb_array_length(structure->'categories') as categories_count
FROM mece_maps
ORDER BY created_at DESC;

-- 最新のMECEデータの詳細確認
SELECT 
    id,
    theme,
    structure,
    jsonb_pretty(structure) as pretty_structure
FROM mece_maps
ORDER BY created_at DESC
LIMIT 1; 