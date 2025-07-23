-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    upload_id UUID NOT NULL REFERENCES public.uploaded_files(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_upload_id ON public.conversations(upload_id);

-- Enable Row Level Security
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for conversations
CREATE POLICY "Users can view their own conversations" ON public.conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" ON public.conversations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" ON public.conversations
    FOR DELETE USING (auth.uid() = user_id); 