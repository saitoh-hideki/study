import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { conversationId, fileId, extractedText, reviewType = 'normal' } = await request.json()
    
    console.log('Received request:', { conversationId, fileId, extractedText: extractedText?.substring(0, 100), reviewType })

    if (!conversationId) {
      return NextResponse.json(
        { error: '会話IDが必要です' },
        { status: 400 }
      )
    }

    // Call Supabase Edge Function
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.log('Environment variables:', { 
      supabaseUrl: !!supabaseUrl, 
      anonKey: !!anonKey 
    })
    
    if (!supabaseUrl || !anonKey) {
      console.error('Missing Supabase configuration')
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      )
    }

    const requestBody = {
      conversationId,
      fileId,
      extractedText,
      reviewType
    }

    console.log('Calling Edge Function with:', requestBody)

    const response = await fetch(`${supabaseUrl}/functions/v1/generate-review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`,
      },
      body: JSON.stringify(requestBody),
    })

    console.log('Edge Function response status:', response.status)

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Edge Function error:', errorData)
      return NextResponse.json(
        { error: 'レビューの生成に失敗しました' },
        { status: 500 }
      )
    }

    const data = await response.json()
    console.log('Edge function response:', data)
    return NextResponse.json(data)

  } catch (error) {
    console.error('Error in generate-review API:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 