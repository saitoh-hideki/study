-- Completely disable RLS for uploaded_files table to allow all operations
ALTER TABLE public.uploaded_files DISABLE ROW LEVEL SECURITY;

-- Also disable RLS for conversations table
ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;

-- Also disable RLS for messages table
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- Also disable RLS for reviews table
ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY; 