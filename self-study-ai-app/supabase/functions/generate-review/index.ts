import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  conversationId: string
  fileId?: string
  extractedText?: string
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

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: '環境変数の設定が不足しています' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Parse request body
    const { conversationId, fileId, extractedText }: RequestBody = await req.json()
    
    console.log('Received request:', { conversationId, fileId, extractedText: extractedText?.substring(0, 100) })

    if (!conversationId) {
      return new Response(
        JSON.stringify({ error: '会話IDが必要です' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get environment variables
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    console.log('OpenAI API Key exists:', !!openaiApiKey)
    
    if (!openaiApiKey) {
      console.error('OpenAI API Key is missing')
      return new Response(
        JSON.stringify({ error: 'OpenAI APIキーが設定されていません' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get conversation messages
    console.log('Fetching messages for conversation:', conversationId)
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    console.log('Messages result:', { messagesCount: messages?.length, error: messagesError })

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      return new Response(
        JSON.stringify({ error: 'メッセージの取得に失敗しました' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!messages || messages.length === 0) {
      console.log('No messages found for conversation:', conversationId)
      return new Response(
        JSON.stringify({ error: '会話が見つかりません' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get file context if available
    let context = extractedText || ''
    if (fileId) {
      const { data: file, error: fileError } = await supabase
        .from('uploaded_files')
        .select('extracted_text')
        .eq('id', fileId)
        .single()

      if (!fileError && file?.extracted_text) {
        context = file.extracted_text
      }
    }

    // Create conversation summary for AI
    const conversationText = messages
      .map(msg => `${msg.role === 'user' ? 'ユーザー' : 'AI'}: ${msg.content}`)
      .join('\n')

    // Generate review using OpenAI
    const reviewPrompt = `以下の会話内容と学習資料を基に、本日の学習レビューを作成してください。

学習資料の内容:
${context}

会話内容:
${conversationText}

以下の形式でレビューを作成してください：

【学習テーマ】
今日の学習テーマを簡潔にまとめてください。

【学んだこと】
会話から得られた重要な学びや気づきを箇条書きでまとめてください。

【理解度】
現在の理解度を5段階で評価し、理由も含めて説明してください。

【次回の学習計画】
次回の学習で取り組みたい内容や改善点を具体的に提案してください。

【総合評価】
今日の学習セッションを総合的に評価し、良かった点と改善点を述べてください。

文字数制限：合計1000文字以内で作成してください。`

    console.log('Calling OpenAI API for review generation...')
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: 'あなたは学習支援の専門家です。学習者の会話内容を分析し、建設的で実用的なレビューを作成してください。'
          },
          {
            role: 'user',
            content: reviewPrompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    })
    
    console.log('OpenAI API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error:', errorText)
      return new Response(
        JSON.stringify({ error: 'レビューの生成に失敗しました' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const result = await response.json()
    const reviewContent = result.choices[0]?.message?.content || 'レビューの生成に失敗しました'

    // Create summary for the review
    const summaryPrompt = `以下のレビュー内容を100文字以内で要約してください：

${reviewContent}`

    const summaryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: summaryPrompt
          }
        ],
        max_tokens: 100,
        temperature: 0.5,
      }),
    })

    let summary = ''
    if (summaryResponse.ok) {
      const summaryResult = await summaryResponse.json()
      summary = summaryResult.choices[0]?.message?.content || ''
    }

    // Get current date for title
    const today = new Date()
    const title = `本日の学習レビュー - ${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`

    // Save review to database
    console.log('Saving review to database...')
    const { data: savedReview, error: saveError } = await supabase
      .from('reviews')
      .insert({
        title,
        content: reviewContent,
        summary,
        ai_generated: true,
        conversation_id: conversationId,
        file_id: fileId || null,
        user_id: null // For anonymous users
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving review:', saveError)
      console.error('Save error details:', {
        message: saveError.message,
        details: saveError.details,
        hint: saveError.hint
      })
      // Still return the review even if saving fails
    } else {
      console.log('Review saved successfully:', savedReview?.id)
    }

    return new Response(
      JSON.stringify({
        id: savedReview?.id,
        title,
        content: reviewContent,
        summary,
        ai_generated: true
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error generating review:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return new Response(
      JSON.stringify({ 
        error: 'サーバーエラーが発生しました',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 