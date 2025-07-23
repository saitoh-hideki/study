import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  message: string
  conversationId: string
  fileId?: string
  extractedText?: string
  difficulty?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Extract the token
    const token = authHeader.replace('Bearer ', '')
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { message, conversationId, fileId, extractedText, difficulty = 'normal' }: RequestBody = await req.json()

    if (!message || !conversationId) {
      return new Response(
        JSON.stringify({ error: 'Message and conversationId are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get file context if fileId is provided
    let context = extractedText || ''
    
    if (fileId) {
      const { data: file, error: fileError } = await supabase
        .from('uploaded_files')
        .select('*')
        .eq('id', fileId)
        .single()

      if (!fileError && file) {
        context = file.extracted_text || ''
      }
    }

    // If no context from file, try to get from conversation
    if (!context) {
      const { data: conversation, error: conversationError } = await supabase
        .from('conversations')
        .select('*, uploads(*)')
        .eq('id', conversationId)
        .single()

      if (!conversationError && conversation) {
        context = conversation.uploads?.extracted_text || ''
      }
    }
    
    // Create system prompt based on difficulty
    const difficultyPrompts = {
      easy: 'あなたは親切で分かりやすい学習アシスタントです。基本的な質問から始めて、段階的に理解を深められるようにサポートしてください。',
      normal: 'あなたは優秀な学習アシスタントです。学習者の理解度を確認しながら、適切な質問で深い理解を促進してください。',
      hard: 'あなたは高度な学習アシスタントです。学習者の思考を深め、批判的思考を促進する質問をしてください。'
    }

    const systemPrompt = `${difficultyPrompts[difficulty as keyof typeof difficultyPrompts]}

学習資料の内容:
${context}

あなたの役割:
1. 学習者の回答に対して適切な質問を投げかける
2. 理解を深めるための追加の質問をする
3. 必要に応じて補足説明を提供する
4. 学習者の思考を促進する

学習者の回答: ${message}

上記の回答に対して、学習を促進する質問やコメントを返してください。`

    // Call OpenAI API with streaming
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          }
        ],
        stream: true,
        max_tokens: 500,
        temperature: 0.7,
      }),
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text()
      console.error('OpenAI API error:', errorData)
      return new Response(
        JSON.stringify({ error: 'Failed to generate AI response' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const reader = openaiResponse.body?.getReader()
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
                  if (parsed.choices?.[0]?.delta?.content) {
                    const content = parsed.choices[0].delta.content
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`))
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
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 