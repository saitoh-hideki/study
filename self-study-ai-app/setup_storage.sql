-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'uploaded-files',
  'uploaded-files',
  true,
  52428800, -- 50MB
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'text/plain']
) ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-files',
  'audio-files',
  true,
  10485760, -- 10MB
  ARRAY['audio/mpeg', 'audio/wav', 'audio/webm']
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for uploaded-files bucket
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'uploaded-files');
CREATE POLICY "Authenticated users can upload files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'uploaded-files' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update their own files" ON storage.objects FOR UPDATE USING (bucket_id = 'uploaded-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own files" ON storage.objects FOR DELETE USING (bucket_id = 'uploaded-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create RLS policies for audio-files bucket
CREATE POLICY "Public Access Audio" ON storage.objects FOR SELECT USING (bucket_id = 'audio-files');
CREATE POLICY "Authenticated users can upload audio" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'audio-files' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update their own audio" ON storage.objects FOR UPDATE USING (bucket_id = 'audio-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own audio" ON storage.objects FOR DELETE USING (bucket_id = 'audio-files' AND auth.uid()::text = (storage.foldername(name))[1]); 