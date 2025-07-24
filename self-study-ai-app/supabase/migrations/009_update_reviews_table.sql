-- Update reviews table structure for review generation
-- First, drop existing constraints and indexes
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_message_id_fkey;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
DROP INDEX IF EXISTS idx_reviews_message_id;

-- Drop existing columns
ALTER TABLE public.reviews DROP COLUMN IF EXISTS message_id;
ALTER TABLE public.reviews DROP COLUMN IF EXISTS understood;
ALTER TABLE public.reviews DROP COLUMN IF EXISTS note;

-- Add new columns
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS file_id UUID REFERENCES public.uploaded_files(id) ON DELETE CASCADE;

-- Make title and content NOT NULL after adding them
ALTER TABLE public.reviews ALTER COLUMN title SET NOT NULL;
ALTER TABLE public.reviews ALTER COLUMN content SET NOT NULL;

-- Make user_id nullable for anonymous users
ALTER TABLE public.reviews ALTER COLUMN user_id DROP NOT NULL;

-- Create new indexes
CREATE INDEX IF NOT EXISTS idx_reviews_conversation_id ON public.reviews(conversation_id);
CREATE INDEX IF NOT EXISTS idx_reviews_file_id ON public.reviews(file_id);

-- Update RLS policies to allow anonymous access
DROP POLICY IF EXISTS "Users can view their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can insert their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;

CREATE POLICY "Users can view their own reviews" ON public.reviews
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own reviews" ON public.reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own reviews" ON public.reviews
    FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own reviews" ON public.reviews
    FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL); 