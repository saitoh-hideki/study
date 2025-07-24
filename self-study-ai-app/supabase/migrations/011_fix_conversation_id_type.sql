-- Fix conversation_id type to support anonymous IDs
-- First, drop foreign key constraints that reference conversations.id
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_conversation_id_fkey;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_conversation_id_fkey;

-- Change conversations.id from UUID to TEXT
ALTER TABLE public.conversations ALTER COLUMN id TYPE TEXT;

-- Change messages.conversation_id from UUID to TEXT
ALTER TABLE public.messages ALTER COLUMN conversation_id TYPE TEXT;

-- Change reviews.conversation_id from UUID to TEXT
ALTER TABLE public.reviews ALTER COLUMN conversation_id TYPE TEXT;

-- Recreate foreign key constraints
ALTER TABLE public.messages 
ADD CONSTRAINT messages_conversation_id_fkey 
FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;

ALTER TABLE public.reviews 
ADD CONSTRAINT reviews_conversation_id_fkey 
FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE; 