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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!openaiApiKey || !supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: '環境変数の設定が不足しています' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create Supabase client
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

    // 特殊処理：最初の「こんにちは」だけの入力に対して挨拶で返す
    if (message.trim() === "こんにちは") {
      // 資料からキーワードを抽出して質問を生成
      const keywordPrompt = `以下の学習資料から最も重要なキーワードを1つ抽出してください。そのキーワードを使って「あなたは[キーワード]についてどう思いますか？」という質問を作成してください。

学習資料:
${context}

重要な指示:
- 「あなたは[キーワード]についてどう思いますか？」という形式のみを返す
- 「キーワード:」や「質問:」などのラベルは含めない
- 資料がない場合は「あなたは学習についてどう思いますか？」を返す

例:
正しい形式: あなたはデジタルトランスフォーメーションについてどう思いますか？
間違った形式: キーワード: DX 質問: あなたはDXについてどう思いますか？`

      const keywordResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: keywordPrompt
            }
          ],
          max_tokens: 100,
          temperature: 0.3,
        }),
      })

      let greetingResponse = "こんにちは！学習を始めましょう。"
      
      if (keywordResponse.ok) {
        const keywordData = await keywordResponse.json()
        const keywordQuestion = keywordData.choices?.[0]?.message?.content?.trim()
        if (keywordQuestion) {
          greetingResponse = `こんにちは！${keywordQuestion}`
        }
      }
      
      // Create streaming response for greeting
      const stream = new ReadableStream({
        async start(controller) {
          const words = greetingResponse.split('')
          for (const char of words) {
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content: char })}\n\n`))
            await new Promise(resolve => setTimeout(resolve, 30))
          }
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
          controller.close()
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
    }
    
    // 難易度ごとのインタビュースタイル
    const difficultyPrompts = {
      easy: "あなたは親切で励まし的なインタビュアーです。相手の話をよく聞き、基本的な質問から始めて、段階的に深掘りしていきます。相手をサポートし、自信を育てるように努めます。",
      normal: "あなたは優秀で分析力のあるインタビュアーです。相手の回答を分析し、より深い理解を得るための洞察に富んだ質問をします。思慮深いフィードバックを提供し、批判的思考を促進します。",
      hard: "あなたは高度な分析スキルを持つインタビュアーです。相手の思考を深め、批判的分析を促進する鋭い質問をします。知的境界を押し広げる思考を刺激する質問をします。"
    };

    // インタビュー形式のプロンプト
    const systemPrompt = `${difficultyPrompts[difficulty as keyof typeof difficultyPrompts]}

学習資料の内容:
${context}

あなたの役割:
1. 相手の回答に対して思慮深い反応を示す（100-150文字程度）
2. 相手の考えを深掘りする洞察に富んだ質問を1つする（200-300文字程度）
3. 必要に応じて関連する質問を1つ追加する（150-200文字程度）

重要なガイドライン:
- 相手の考えを探る質問に焦点を当てる
- 自然で会話的な応答を保つ
- 理解を示し、否定的にならない
- 学習資料を参考に、より具体的な質問をする
- より深い反省と分析を促進する
- 知的に刺激的でありながら、サポート的なトーンを保つ
- 最適なエンゲージメントのために、合計600-800文字以内に収める

学習者の回答: ${message}

より深い思考と学習を促進するインタビュー形式で応答してください。指定された文字数制限内で回答してください。`

    // Call OpenAI API with streaming
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          }
        ],
        stream: true,
        max_tokens: 800,
        temperature: 0.3,
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