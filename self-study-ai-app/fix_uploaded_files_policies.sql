-- Drop existing policies for uploaded_files table
DROP POLICY IF EXISTS "Users can view their own uploaded files" ON public.uploaded_files;
DROP POLICY IF EXISTS "Users can insert their own uploaded files" ON public.uploaded_files;
DROP POLICY IF EXISTS "Users can update their own uploaded files" ON public.uploaded_files;
DROP POLICY IF EXISTS "Users can delete their own uploaded files" ON public.uploaded_files;

-- Create new RLS policies for uploaded_files
CREATE POLICY "Users can view their own uploaded files" ON public.uploaded_files
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own uploaded files" ON public.uploaded_files
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own uploaded files" ON public.uploaded_files
    FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own uploaded files" ON public.uploaded_files
    FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL); 