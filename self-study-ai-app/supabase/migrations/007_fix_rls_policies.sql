-- Fix RLS policies for uploaded_files table to allow anonymous uploads
DROP POLICY IF EXISTS "Users can view their own uploaded files" ON public.uploaded_files;
DROP POLICY IF EXISTS "Users can insert their own uploaded files" ON public.uploaded_files;
DROP POLICY IF EXISTS "Users can update their own uploaded files" ON public.uploaded_files;
DROP POLICY IF EXISTS "Users can delete their own uploaded files" ON public.uploaded_files;

-- Create new policies that allow anonymous uploads
CREATE POLICY "Allow all users to view uploaded files" ON public.uploaded_files
    FOR SELECT USING (true);

CREATE POLICY "Allow all users to insert uploaded files" ON public.uploaded_files
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow users to update their own uploaded files" ON public.uploaded_files
    FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Allow users to delete their own uploaded files" ON public.uploaded_files
    FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- Also fix policies for conversations table
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can insert their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can delete their own conversations" ON public.conversations;

CREATE POLICY "Allow all users to view conversations" ON public.conversations
    FOR SELECT USING (true);

CREATE POLICY "Allow all users to insert conversations" ON public.conversations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow users to update their own conversations" ON public.conversations
    FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Allow users to delete their own conversations" ON public.conversations
    FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- Fix policies for messages table
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages to their conversations" ON public.messages;

CREATE POLICY "Allow all users to view messages" ON public.messages
    FOR SELECT USING (true);

CREATE POLICY "Allow all users to insert messages" ON public.messages
    FOR INSERT WITH CHECK (true); 