-- Fix foreign key constraint for five_why_trees table
-- Drop the existing foreign key constraint
ALTER TABLE public.five_why_trees 
DROP CONSTRAINT IF EXISTS five_why_trees_conversation_id_fkey;

-- Add the foreign key constraint back with ON DELETE SET NULL
ALTER TABLE public.five_why_trees 
ADD CONSTRAINT five_why_trees_conversation_id_fkey 
FOREIGN KEY (conversation_id) 
REFERENCES public.conversations(id) 
ON DELETE SET NULL;

-- Update existing records to set conversation_id to NULL if the conversation doesn't exist
UPDATE public.five_why_trees 
SET conversation_id = NULL 
WHERE conversation_id IS NOT NULL 
AND NOT EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE conversations.id = five_why_trees.conversation_id
); 