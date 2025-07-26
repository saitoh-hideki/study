-- MECEデータのデバッグ用SQLクエリ

-- 1. テーブル構造の確認
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'mece_maps' 
ORDER BY ordinal_position;

-- 2. 全MECEデータの確認
SELECT 
    id,
    user_id,
    theme,
    created_at,
    updated_at,
    jsonb_typeof(structure) as structure_type,
    jsonb_array_length(structure->'categories') as categories_count
FROM mece_maps
ORDER BY created_at DESC;

-- 3. 特定のMECEデータの詳細確認（最新のものを確認）
WITH latest_mece AS (
    SELECT id, structure
    FROM mece_maps
    ORDER BY created_at DESC
    LIMIT 1
)
SELECT 
    id,
    structure,
    jsonb_pretty(structure) as pretty_structure
FROM latest_mece;

-- 4. カテゴリーごとの対策データ確認
WITH latest_mece AS (
    SELECT id, structure
    FROM mece_maps
    ORDER BY created_at DESC
    LIMIT 1
)
SELECT 
    id,
    jsonb_array_elements(structure->'categories') as category
FROM latest_mece;

-- 5. 対策データの詳細確認
WITH latest_mece AS (
    SELECT id, structure
    FROM mece_maps
    ORDER BY created_at DESC
    LIMIT 1
),
category_data AS (
    SELECT 
        id,
        jsonb_array_elements(structure->'categories') as category
    FROM latest_mece
)
SELECT 
    category->>'id' as category_id,
    category->>'name' as category_name,
    category->>'description' as category_description,
    category->'countermeasures'->'ai' as ai_countermeasures,
    category->'countermeasures'->>'user' as user_countermeasure,
    jsonb_array_length(category->'countermeasures'->'ai') as ai_count,
    length(category->'countermeasures'->>'user') as user_length
FROM category_data; 