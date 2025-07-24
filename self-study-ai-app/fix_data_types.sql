-- Fix data type mismatch: Change conversation_id from text to uuid
-- This will allow proper foreign key relationships with sessions table

-- Step 1: Drop existing foreign key constraints first
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_conversation_id_fkey;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_conversation_id_fkey;

-- Step 2: Change data types from text to uuid
ALTER TABLE public.messages ALTER COLUMN conversation_id TYPE uuid USING conversation_id::uuid;
ALTER TABLE public.reviews ALTER COLUMN conversation_id TYPE uuid USING conversation_id::uuid;

-- Step 3: Add foreign key constraints to reference sessions table
ALTER TABLE public.messages 
ADD CONSTRAINT messages_conversation_id_fkey 
FOREIGN KEY (conversation_id) REFERENCES public.sessions(id) ON DELETE CASCADE;

ALTER TABLE public.reviews 
ADD CONSTRAINT reviews_conversation_id_fkey 
FOREIGN KEY (conversation_id) REFERENCES public.sessions(id) ON DELETE CASCADE; 