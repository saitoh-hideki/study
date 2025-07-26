-- Create thinking_images table
CREATE TABLE IF NOT EXISTS thinking_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  theme TEXT,
  prompt TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE thinking_images ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own thinking images" ON thinking_images
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own thinking images" ON thinking_images
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own thinking images" ON thinking_images
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own thinking images" ON thinking_images
  FOR DELETE USING (auth.uid() = user_id);

-- Create index
CREATE INDEX IF NOT EXISTS idx_thinking_images_user_id ON thinking_images(user_id);
CREATE INDEX IF NOT EXISTS idx_thinking_images_created_at ON thinking_images(created_at DESC); 