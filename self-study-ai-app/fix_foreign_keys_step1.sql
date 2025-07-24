-- Step 1: Drop existing foreign key constraints
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_conversation_id_fkey;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_conversation_id_fkey; 