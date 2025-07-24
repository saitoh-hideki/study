-- Step 2: Add new foreign key constraints to reference sessions table
ALTER TABLE public.messages 
ADD CONSTRAINT messages_conversation_id_fkey 
FOREIGN KEY (conversation_id) REFERENCES public.sessions(id) ON DELETE CASCADE;

ALTER TABLE public.reviews 
ADD CONSTRAINT reviews_conversation_id_fkey 
FOREIGN KEY (conversation_id) REFERENCES public.sessions(id) ON DELETE CASCADE; 