-- 手動実行用: RLSポリシーを完全に無効化してアップロード機能を確実に動作させる

-- 1. uploaded_filesテーブルのRLSを無効化
ALTER TABLE public.uploaded_files DISABLE ROW LEVEL SECURITY;

-- 2. conversationsテーブルのRLSを無効化
ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;

-- 3. messagesテーブルのRLSを無効化
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- 4. reviewsテーブルのRLSを無効化
ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY;

-- 5. 既存のポリシーを削除（エラーが出ても無視）
DROP POLICY IF EXISTS "Users can view their own uploaded files" ON public.uploaded_files;
DROP POLICY IF EXISTS "Users can insert their own uploaded files" ON public.uploaded_files;
DROP POLICY IF EXISTS "Users can update their own uploaded files" ON public.uploaded_files;
DROP POLICY IF EXISTS "Users can delete their own uploaded files" ON public.uploaded_files;

DROP POLICY IF EXISTS "Allow all users to view uploaded files" ON public.uploaded_files;
DROP POLICY IF EXISTS "Allow all users to insert uploaded files" ON public.uploaded_files;
DROP POLICY IF EXISTS "Allow users to update their own uploaded files" ON public.uploaded_files;
DROP POLICY IF EXISTS "Allow users to delete their own uploaded files" ON public.uploaded_files;

-- 6. conversationsテーブルのポリシーも削除
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can insert their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can delete their own conversations" ON public.conversations;

DROP POLICY IF EXISTS "Allow all users to view conversations" ON public.conversations;
DROP POLICY IF EXISTS "Allow all users to insert conversations" ON public.conversations;
DROP POLICY IF EXISTS "Allow users to update their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Allow users to delete their own conversations" ON public.conversations;

-- 7. messagesテーブルのポリシーも削除
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages to their conversations" ON public.messages;

DROP POLICY IF EXISTS "Allow all users to view messages" ON public.messages;
DROP POLICY IF EXISTS "Allow all users to insert messages" ON public.messages;

-- 8. reviewsテーブルのポリシーも削除
DROP POLICY IF EXISTS "Users can view their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can insert their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;

-- 確認用: テーブルのRLS状態を確認
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('uploaded_files', 'conversations', 'messages', 'reviews')
ORDER BY tablename; 