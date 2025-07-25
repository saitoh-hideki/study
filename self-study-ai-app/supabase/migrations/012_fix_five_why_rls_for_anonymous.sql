-- Fix RLS policies for anonymous users in five_why_tables
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own five why trees" ON public.five_why_trees;
DROP POLICY IF EXISTS "Users can insert their own five why trees" ON public.five_why_trees;
DROP POLICY IF EXISTS "Users can update their own five why trees" ON public.five_why_trees;
DROP POLICY IF EXISTS "Users can delete their own five why trees" ON public.five_why_trees;

DROP POLICY IF EXISTS "Users can view levels from their five why trees" ON public.five_why_levels;
DROP POLICY IF EXISTS "Users can insert levels to their five why trees" ON public.five_why_levels;
DROP POLICY IF EXISTS "Users can update levels in their five why trees" ON public.five_why_levels;
DROP POLICY IF EXISTS "Users can delete levels from their five why trees" ON public.five_why_levels;

-- Create new policies that allow anonymous users
CREATE POLICY "Users can view their own five why trees" ON public.five_why_trees
    FOR SELECT USING (
        (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
        (auth.uid() IS NULL AND user_id IS NULL)
    );

CREATE POLICY "Users can insert their own five why trees" ON public.five_why_trees
    FOR INSERT WITH CHECK (
        (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
        (auth.uid() IS NULL AND user_id IS NULL)
    );

CREATE POLICY "Users can update their own five why trees" ON public.five_why_trees
    FOR UPDATE USING (
        (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
        (auth.uid() IS NULL AND user_id IS NULL)
    );

CREATE POLICY "Users can delete their own five why trees" ON public.five_why_trees
    FOR DELETE USING (
        (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
        (auth.uid() IS NULL AND user_id IS NULL)
    );

-- Create new policies for five_why_levels
CREATE POLICY "Users can view levels from their five why trees" ON public.five_why_levels
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.five_why_trees
            WHERE five_why_trees.id = five_why_levels.five_why_tree_id
            AND (
                (auth.uid() IS NOT NULL AND five_why_trees.user_id = auth.uid()) OR 
                (auth.uid() IS NULL AND five_why_trees.user_id IS NULL)
            )
        )
    );

CREATE POLICY "Users can insert levels to their five why trees" ON public.five_why_levels
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.five_why_trees
            WHERE five_why_trees.id = five_why_levels.five_why_tree_id
            AND (
                (auth.uid() IS NOT NULL AND five_why_trees.user_id = auth.uid()) OR 
                (auth.uid() IS NULL AND five_why_trees.user_id IS NULL)
            )
        )
    );

CREATE POLICY "Users can update levels in their five why trees" ON public.five_why_levels
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.five_why_trees
            WHERE five_why_trees.id = five_why_levels.five_why_tree_id
            AND (
                (auth.uid() IS NOT NULL AND five_why_trees.user_id = auth.uid()) OR 
                (auth.uid() IS NULL AND five_why_trees.user_id IS NULL)
            )
        )
    );

CREATE POLICY "Users can delete levels from their five why trees" ON public.five_why_levels
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.five_why_trees
            WHERE five_why_trees.id = five_why_levels.five_why_tree_id
            AND (
                (auth.uid() IS NOT NULL AND five_why_trees.user_id = auth.uid()) OR 
                (auth.uid() IS NULL AND five_why_trees.user_id IS NULL)
            )
        )
    ); 