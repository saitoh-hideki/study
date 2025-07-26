import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, conversationId, fileId, difficulty, messages, type } = body

    console.log('API Request:', { message, conversationId, fileId, difficulty, messages, type })

    // 5 Whys Analysisの場合はmessagesを使用
    if (type === 'five-why-question') {
      if (!messages || !Array.isArray(messages)) {
        console.error('Missing or invalid messages array for 5 Whys')
        return NextResponse.json(
          { error: 'Messages array is required for 5 Whys analysis' },
          { status: 400 }
        )
      }
    } else {
      // 通常のチャットの場合は従来のバリデーション
      if (!message || !conversationId) {
        console.error('Missing required fields:', { message: !!message, conversationId: !!conversationId })
        return NextResponse.json(
          { error: 'Message and conversationId are required' },
          { status: 400 }
        )
      }
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

    // 5 Whys Analysisの場合は異なるリクエストボディを使用
    const requestBody = type === 'five-why-question' 
      ? { messages, type }
      : {
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

    // Return streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        if (!reader) {
          controller.close()
          return
        }

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = new TextDecoder().decode(value)
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') {
                  controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
                  break
                }

                try {
                  const parsed = JSON.parse(data)
                  if (parsed.content) {
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content: parsed.content })}\n\n`))
                  } else if (parsed.error) {
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ error: parsed.error })}\n\n`))
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } catch (error) {
          console.error('Streaming error:', error)
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ error: 'Streaming error' })}\n\n`))
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 