-- Fix books table to allow anonymous access
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own books" ON books;
DROP POLICY IF EXISTS "Users can insert their own books" ON books;
DROP POLICY IF EXISTS "Users can update their own books" ON books;
DROP POLICY IF EXISTS "Users can delete their own books" ON books;

-- Create new policies for anonymous access
CREATE POLICY "Allow anonymous users to view all books" ON books
  FOR SELECT USING (true);

CREATE POLICY "Allow anonymous users to insert books" ON books
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous users to update books" ON books
  FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous users to delete books" ON books
  FOR DELETE USING (true); 