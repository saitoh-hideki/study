-- Create MECE analysis tables
-- Migration: 014_create_mece_tables.sql

-- Create mece_maps table
CREATE TABLE IF NOT EXISTS mece_maps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT NOT NULL,
  structure JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_mece_maps_user_id ON mece_maps(user_id);
CREATE INDEX IF NOT EXISTS idx_mece_maps_created_at ON mece_maps(created_at DESC);

-- Enable Row Level Security
ALTER TABLE mece_maps ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for mece_maps
-- Allow users to see their own MECE maps
CREATE POLICY "Users can view their own MECE maps" ON mece_maps
  FOR SELECT USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
    (auth.uid() IS NULL AND user_id IS NULL)
  );

-- Allow users to insert their own MECE maps
CREATE POLICY "Users can insert their own MECE maps" ON mece_maps
  FOR INSERT WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
    (auth.uid() IS NULL AND user_id IS NULL)
  );

-- Allow users to update their own MECE maps
CREATE POLICY "Users can update their own MECE maps" ON mece_maps
  FOR UPDATE USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
    (auth.uid() IS NULL AND user_id IS NULL)
  );

-- Allow users to delete their own MECE maps
CREATE POLICY "Users can delete their own MECE maps" ON mece_maps
  FOR DELETE USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
    (auth.uid() IS NULL AND user_id IS NULL)
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_mece_maps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_mece_maps_updated_at
  BEFORE UPDATE ON mece_maps
  FOR EACH ROW
  EXECUTE FUNCTION update_mece_maps_updated_at(); 