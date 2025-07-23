-- Fix uploads table to allow NULL user_id for anonymous uploads
ALTER TABLE public.uploads ALTER COLUMN user_id DROP NOT NULL;

-- Update RLS policies to allow anonymous access
DROP POLICY IF EXISTS "Users can view their own uploads" ON public.uploads;
DROP POLICY IF EXISTS "Users can insert their own uploads" ON public.uploads;
DROP POLICY IF EXISTS "Users can update their own uploads" ON public.uploads;
DROP POLICY IF EXISTS "Users can delete their own uploads" ON public.uploads;

-- Create new RLS policies for uploads that allow anonymous access
CREATE POLICY "Users can view their own uploads" ON public.uploads
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own uploads" ON public.uploads
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own uploads" ON public.uploads
    FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own uploads" ON public.uploads
    FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL); 