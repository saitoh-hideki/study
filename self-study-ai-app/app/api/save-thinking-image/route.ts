import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { title, theme, prompt, imageUrl } = await request.json()
    
    if (!title || !imageUrl) {
      return NextResponse.json(
        { error: 'Title and image URL are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Save thinking image to database
    const { data, error } = await supabase
      .from('thinking_images')
      .insert({
        user_id: user.id,
        title,
        theme,
        prompt,
        image_url: imageUrl
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving thinking image:', error)
      return NextResponse.json(
        { error: 'Failed to save thinking image' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      thinkingImage: data
    })

  } catch (error) {
    console.error('Error in save-thinking-image API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 