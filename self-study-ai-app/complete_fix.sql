-- Complete fix for the self-study AI app database issues

-- 1. Create uploaded_files table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.uploaded_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    extracted_text TEXT
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_uploaded_files_user_id ON public.uploaded_files(user_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_created_at ON public.uploaded_files(created_at);

-- 3. Enable Row Level Security
ALTER TABLE public.uploaded_files ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies for uploaded_files table
DROP POLICY IF EXISTS "Users can view their own uploaded files" ON public.uploaded_files;
DROP POLICY IF EXISTS "Users can insert their own uploaded files" ON public.uploaded_files;
DROP POLICY IF EXISTS "Users can update their own uploaded files" ON public.uploaded_files;
DROP POLICY IF EXISTS "Users can delete their own uploaded files" ON public.uploaded_files;

-- 5. Create new RLS policies for uploaded_files
CREATE POLICY "Users can view their own uploaded files" ON public.uploaded_files
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own uploaded files" ON public.uploaded_files
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own uploaded files" ON public.uploaded_files
    FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own uploaded files" ON public.uploaded_files
    FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- 6. Fix conversations table foreign key constraint
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_upload_id_fkey;
ALTER TABLE public.conversations 
ADD CONSTRAINT conversations_upload_id_fkey 
FOREIGN KEY (upload_id) REFERENCES public.uploaded_files(id) ON DELETE CASCADE; 