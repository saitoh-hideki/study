import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'text/plain']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, Word, and text files are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    console.log('Supabase client created successfully')

    // Upload file to Supabase Storage
    const fileName = `${Date.now()}-${file.name}`
    console.log('Attempting to upload file:', fileName)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('uploaded-files')
      .upload(fileName, file)

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: `Failed to upload file: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('uploaded-files')
      .getPublicUrl(fileName)

    // Extract text based on file type
    let extractedText = ''
    
    if (file.type === 'application/pdf') {
      // For PDF files, we'll use a simple text extraction
      // In production, you might want to use a more sophisticated PDF parser
      extractedText = `PDFファイル「${file.name}」がアップロードされました。\n\nこのファイルの内容に基づいてAIインタビューを開始できます。\n\n実際の実装では、PDFの内容を解析してテキストを抽出します。`
    } else if (file.type.includes('word')) {
      // For Word documents
      extractedText = `Wordファイル「${file.name}」がアップロードされました。\n\nこのファイルの内容に基づいてAIインタビューを開始できます。\n\n実際の実装では、Word文書の内容を解析してテキストを抽出します。`
    } else if (file.type === 'text/plain') {
      // For text files
      const textContent = await file.text()
      extractedText = textContent
    }

    // Save to database - use correct table name and handle user_id properly
    const insertData: any = {
      file_name: file.name,
      file_path: urlData.publicUrl,
      extracted_text: extractedText,
    }

    // Only add user_id if it's a valid UUID and user is authenticated
    if (userId && userId.trim() !== '') {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (uuidRegex.test(userId)) {
        insertData.user_id = userId
      }
    }
    // If no valid user_id, it will be null (anonymous upload)

    console.log('Attempting to insert data:', JSON.stringify(insertData, null, 2))

    const { data: dbData, error: dbError } = await supabase
      .from('uploaded_files')
      .insert(insertData)
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      console.error('Error details:', {
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint,
        code: dbError.code
      })
      return NextResponse.json(
        { error: `Failed to save file information: ${dbError.message}` },
        { status: 500 }
      )
    }

    console.log('Database insert successful:', dbData)

    return NextResponse.json({
      success: true,
      fileId: dbData.id,
      fileName: file.name,
      extractedText: extractedText,
      fileUrl: urlData.publicUrl
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 