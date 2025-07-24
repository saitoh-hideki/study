-- 完全な修正SQL: すべてのRLSポリシーとストレージポリシーを修正

-- 1. データベーステーブルのRLSを完全に無効化
ALTER TABLE public.uploaded_files DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY;

-- 2. 既存のポリシーをすべて削除
DROP POLICY IF EXISTS "Users can view their own uploaded files" ON public.uploaded_files;
DROP POLICY IF EXISTS "Users can insert their own uploaded files" ON public.uploaded_files;
DROP POLICY IF EXISTS "Users can update their own uploaded files" ON public.uploaded_files;
DROP POLICY IF EXISTS "Users can delete their own uploaded files" ON public.uploaded_files;

DROP POLICY IF EXISTS "Allow all users to view uploaded files" ON public.uploaded_files;
DROP POLICY IF EXISTS "Allow all users to insert uploaded files" ON public.uploaded_files;
DROP POLICY IF EXISTS "Allow all users to update uploaded files" ON public.uploaded_files;
DROP POLICY IF EXISTS "Allow all users to delete uploaded files" ON public.uploaded_files;

DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can insert their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can delete their own conversations" ON public.conversations;

DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;

DROP POLICY IF EXISTS "Users can view their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can insert their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;

-- 3. ストレージポリシーを修正
-- uploaded-filesバケットのポリシー
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
DROP POLICY IF EXISTS "Public Update" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete" ON storage.objects;

-- audio-filesバケットのポリシー
DROP POLICY IF EXISTS "Public Access Audio" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload Audio" ON storage.objects;
DROP POLICY IF EXISTS "Public Update Audio" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete Audio" ON storage.objects;

-- 4. 新しいストレージポリシーを作成（完全に公開）
CREATE POLICY "Public Access All" ON storage.objects FOR SELECT USING (true);
CREATE POLICY "Public Upload All" ON storage.objects FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update All" ON storage.objects FOR UPDATE USING (true);
CREATE POLICY "Public Delete All" ON storage.objects FOR DELETE USING (true);

-- 5. 確認用のクエリ
SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('uploaded_files', 'conversations', 'messages', 'reviews'); 