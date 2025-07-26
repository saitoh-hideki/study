import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { title, content, summary, conversationId } = await request.json()

    if (!title || !content || !conversationId) {
      return NextResponse.json(
        { error: '必要な情報が不足しています' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Save review to database (no authentication required)
    const { data: review, error: saveError } = await supabase
      .from('reviews')
      .insert({
        user_id: null, // No authentication required
        conversation_id: conversationId,
        title,
        content,
        summary,
        ai_generated: true
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving review:', saveError)
      return NextResponse.json(
        { error: 'レビューの保存に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      review 
    })

  } catch (error) {
    console.error('Error in save-review API:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
} 