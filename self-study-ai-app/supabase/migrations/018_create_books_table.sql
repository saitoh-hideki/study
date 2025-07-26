-- Create books table
CREATE TABLE IF NOT EXISTS books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  introduction TEXT,
  chapters JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access
CREATE POLICY "Allow anonymous users to view all books" ON books
  FOR SELECT USING (true);

CREATE POLICY "Allow anonymous users to insert books" ON books
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous users to update books" ON books
  FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous users to delete books" ON books
  FOR DELETE USING (true);

-- Create index
CREATE INDEX IF NOT EXISTS idx_books_user_id ON books(user_id);
CREATE INDEX IF NOT EXISTS idx_books_created_at ON books(created_at DESC); 