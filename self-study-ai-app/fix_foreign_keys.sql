-- Fix foreign key constraints to reference sessions table instead of conversations

-- 1. Drop existing foreign key constraints
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_conversation_id_fkey;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_conversation_id_fkey;

-- 2. Add new foreign key constraints to reference sessions table
ALTER TABLE public.messages 
ADD CONSTRAINT messages_conversation_id_fkey 
FOREIGN KEY (conversation_id) REFERENCES public.sessions(id) ON DELETE CASCADE;

ALTER TABLE public.reviews 
ADD CONSTRAINT reviews_conversation_id_fkey 
FOREIGN KEY (conversation_id) REFERENCES public.sessions(id) ON DELETE CASCADE;

-- 3. Update RLS policies for messages to reference sessions
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages to their conversations" ON public.messages;
DROP POLICY IF EXISTS "Allow all users to view messages" ON public.messages;
DROP POLICY IF EXISTS "Allow all users to insert messages" ON public.messages;

-- Create new policies that reference sessions
CREATE POLICY "Users can view messages from their sessions" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.sessions
            WHERE sessions.id = messages.conversation_id
            AND (sessions.user_id = auth.uid() OR sessions.user_id IS NULL)
        )
    );

CREATE POLICY "Users can insert messages to their sessions" ON public.messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.sessions
            WHERE sessions.id = messages.conversation_id
            AND (sessions.user_id = auth.uid() OR sessions.user_id IS NULL)
        )
    );

-- 4. Update RLS policies for reviews to reference sessions
DROP POLICY IF EXISTS "Users can view their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can insert their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;

CREATE POLICY "Users can view reviews from their sessions" ON public.reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.sessions
            WHERE sessions.id = reviews.conversation_id
            AND (sessions.user_id = auth.uid() OR sessions.user_id IS NULL)
        )
    );

CREATE POLICY "Users can insert reviews to their sessions" ON public.reviews
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.sessions
            WHERE sessions.id = reviews.conversation_id
            AND (sessions.user_id = auth.uid() OR sessions.user_id IS NULL)
        )
    );

CREATE POLICY "Users can update reviews from their sessions" ON public.reviews
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.sessions
            WHERE sessions.id = reviews.conversation_id
            AND (sessions.user_id = auth.uid() OR sessions.user_id IS NULL)
        )
    );

CREATE POLICY "Users can delete reviews from their sessions" ON public.reviews
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.sessions
            WHERE sessions.id = reviews.conversation_id
            AND (sessions.user_id = auth.uid() OR sessions.user_id IS NULL)
        )
    ); 