import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, messageId, voiceType } = body

    if (!text || !messageId) {
      return NextResponse.json(
        { error: 'Text and messageId are required' },
        { status: 400 }
      )
    }

    // Call Supabase Edge Function
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      )
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/generate-speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        text,
        messageId,
        voiceType: voiceType || 'Rachel',
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Edge Function error:', errorData)
      return NextResponse.json(
        { error: 'Failed to generate speech' },
        { status: 500 }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 