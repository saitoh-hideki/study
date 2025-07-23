import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, conversationId, fileId, difficulty } = body

    console.log('API Request:', { message, conversationId, fileId, difficulty })

    if (!message || !conversationId) {
      console.error('Missing required fields:', { message: !!message, conversationId: !!conversationId })
      return NextResponse.json(
        { error: 'Message and conversationId are required' },
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
      message,
      conversationId,
      fileId,
      difficulty: difficulty || 'normal',
    }

    console.log('Calling Edge Function with:', requestBody)

    const response = await fetch(`${supabaseUrl}/functions/v1/generate-ai-response`, {
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
        { error: 'Failed to generate AI response' },
        { status: 500 }
      )
    }

    const data = await response.json()
    console.log('Edge Function success:', data)
    return NextResponse.json(data)

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 