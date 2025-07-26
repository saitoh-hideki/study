-- Fix conversations table to reference uploaded_files instead of uploads
-- First, drop the existing foreign key constraint
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_upload_id_fkey;

-- Add the correct foreign key constraint
ALTER TABLE public.conversations 
ADD CONSTRAINT conversations_upload_id_fkey 
FOREIGN KEY (upload_id) REFERENCES public.uploaded_files(id) ON DELETE CASCADE; 