import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { title, introduction, chapters } = await request.json()
    
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Ensure chapters is always an array
    const chaptersArray = chapters || []

    const supabase = await createClient()
    
    // Save book to database without authentication
    const { data, error } = await supabase
      .from('books')
      .insert({
        user_id: null, // Allow anonymous users
        title,
        introduction,
        chapters: chaptersArray
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving book:', error)
      return NextResponse.json(
        { error: 'Failed to save book' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      book: data
    })

  } catch (error) {
    console.error('Error in save-book API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 