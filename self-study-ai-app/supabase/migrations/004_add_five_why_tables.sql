-- Create five_why_trees table
CREATE TABLE public.five_why_trees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    root_cause TEXT,
    insights JSONB,
    metadata JSONB
);

-- Create five_why_levels table
CREATE TABLE public.five_why_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    five_why_tree_id UUID NOT NULL REFERENCES public.five_why_trees(id) ON DELETE CASCADE,
    level_number INTEGER NOT NULL CHECK (level_number >= 1 AND level_number <= 5),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes
CREATE INDEX idx_five_why_trees_user_id ON public.five_why_trees(user_id);
CREATE INDEX idx_five_why_trees_conversation_id ON public.five_why_trees(conversation_id);
CREATE INDEX idx_five_why_levels_tree_id ON public.five_why_levels(five_why_tree_id);
CREATE INDEX idx_five_why_levels_level_number ON public.five_why_levels(level_number);

-- Enable Row Level Security
ALTER TABLE public.five_why_trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.five_why_levels ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for five_why_trees
CREATE POLICY "Users can view their own five why trees" ON public.five_why_trees
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own five why trees" ON public.five_why_trees
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own five why trees" ON public.five_why_trees
    FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own five why trees" ON public.five_why_trees
    FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- Create RLS policies for five_why_levels
CREATE POLICY "Users can view levels from their five why trees" ON public.five_why_levels
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.five_why_trees
            WHERE five_why_trees.id = five_why_levels.five_why_tree_id
            AND (five_why_trees.user_id = auth.uid() OR five_why_trees.user_id IS NULL)
        )
    );

CREATE POLICY "Users can insert levels to their five why trees" ON public.five_why_levels
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.five_why_trees
            WHERE five_why_trees.id = five_why_levels.five_why_tree_id
            AND (five_why_trees.user_id = auth.uid() OR five_why_trees.user_id IS NULL)
        )
    );

CREATE POLICY "Users can update levels in their five why trees" ON public.five_why_levels
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.five_why_trees
            WHERE five_why_trees.id = five_why_levels.five_why_tree_id
            AND (five_why_trees.user_id = auth.uid() OR five_why_trees.user_id IS NULL)
        )
    );

CREATE POLICY "Users can delete levels from their five why trees" ON public.five_why_levels
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.five_why_trees
            WHERE five_why_trees.id = five_why_levels.five_why_tree_id
            AND (five_why_trees.user_id = auth.uid() OR five_why_trees.user_id IS NULL)
        )
    ); 