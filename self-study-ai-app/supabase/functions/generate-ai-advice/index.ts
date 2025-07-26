import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  bookTitle: string
  introduction?: string
  chapters?: any[]
  userMessage?: string
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

    console.log('Edge Function: Request received')
    const { bookTitle, introduction, chapters, userMessage }: RequestBody = await req.json()
    
    console.log('Received request:', { bookTitle, introduction, chapters: chapters?.length, userMessage })
    
    // Allow empty book title for general chat
    const bookTitleToUse = bookTitle || 'Untitled Book'

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not set' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Ensure chapters is always an array
    const chaptersArray = chapters || []

    // Format chapters array into readable text
    const chaptersText = chaptersArray.map((ch: any, idx: any) => 
      `第${idx + 1}章: ${ch.title}\n${ch.content}`
    ).join('\n\n')

    // Create AI prompt
    const systemPrompt = `あなたは本の執筆をサポートするAIアシスタントです。ユーザーと自然に会話しながら、本の執筆を全面的にサポートしてください。

提供された本の情報を「読んで」理解し、以下のような質問に詳しく回答してください：

【本の構成・企画に関する質問】
- 「本のタイトルは○○なんだけど、どういう章構成にしたらいい？」→ タイトルに基づいて章構成を提案
- 「第1章のタイトルは○○なんだけど、中身でどういう風にした方がいい？」→ 章のタイトルに基づいて内容構成を提案
- 「全体の構成を改善したい」→ 現在の構成を分析して改善案を提示

【本の内容に関する質問】
- 「第1章はどう書いたの？」→ 第1章の内容を確認して分析・評価
- 「この章の内容は適切？」→ 章の内容を読んで評価・改善提案
- 「イントロダクションは何について？」→ イントロダクションの内容を説明・分析

【執筆アドバイス】
- 「もっと読みやすくするには？」→ 文章構成、表現、論理展開の改善提案
- 「章の順序を変えた方がいい？」→ 現在の構成を分析して順序の提案
- 「読者に伝わりやすくするには？」→ 読者視点での改善提案

【一般的な会話】
- 自然な会話も続けられる

必ず日本語で回答し、具体的で実践的なアドバイスを提供してください。本の内容を「読んで」理解した上で、建設的で励まし的なトーンで回答してください。`

    const userPrompt = `【現在執筆中の本の詳細情報】

📖 本のタイトル: ${bookTitleToUse}
📝 イントロダクション: ${introduction || ''}

📚 章の構成と内容:
${chaptersArray.length === 0 ? 'まだ章が追加されていません。' : chaptersText}

${userMessage ? `❓ ユーザーの質問: ${userMessage}

上記の本の情報を詳しく「読んで」理解した上で、ユーザーの質問に具体的で実践的な回答を提供してください。

特に以下の点に注意して回答してください：
- 本の構成・企画に関する質問：タイトルや章構成に基づいて具体的な提案
- 章の内容に関する質問：実際の内容を読んで分析・評価・改善提案
- 執筆アドバイス：現在の内容を踏まえた具体的な改善案
- 一般的な会話：自然な会話を続ける

必ず本の内容を「読んで」理解した上で回答してください。` : `この本全体を分析し、改善のための具体的で実践的なアドバイスを提供してください。
構成、内容、読みやすさ、読者への伝わりやすさなど、多角的な視点から提案してください。`}`

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
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        stream: true,
        max_tokens: 800,
        temperature: 0.7,
      }),
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text()
      console.error('OpenAI API error:', errorData)
      return new Response(
        JSON.stringify({ error: 'Failed to generate AI advice' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 