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

    // Generate enhanced review using OpenAI
    const reviewPrompt = `以下の会話内容を詳細に分析し、学習者の理解度と学習プロセスを中心としたレビューを作成してください。

【学習資料の内容】（参考情報）
${context}

【会話内容】（メイン分析対象）
${conversationText}

以下の形式で、会話の流れを中心とした詳細なレビューを作成してください：

## 📚 今日の学習セッション概要
- 学習者が取り組んだテーマ
- 会話の総時間・メッセージ数
- 学習者の積極性レベル

## 💬 会話の流れと学習プロセス分析
### 学習の進行パターン
- **質問の質の変化**: 学習者の質問がどのように深まっていったか
- **理解の段階**: 表面的な理解から深い洞察への変化
- **興味の焦点**: 学習者が特に興味を持った部分とその理由
- **困難な点**: 学習者が躊躇した部分や理解に時間がかかった点

### 学習者の反応分析
- **積極的な質問**: 学習者が自発的に尋ねた質問とその背景
- **理解の確認**: 学習者が自分の理解を確認しようとした場面
- **実践的思考**: 理論を実際に応用しようとした発言
- **疑問・不安**: 学習者が感じた疑問や不安な点

## 🎯 学習者の理解度評価（会話ベース）
### 分野別理解度
- **概念理解**: 会話から見える学習者の概念把握レベル
- **実践応用**: 理論を実際の状況に当てはめる能力
- **批判的思考**: 情報を批判的に分析する能力
- **関連性理解**: 異なる概念間の関連性を理解する能力

### 学習スタイルの特徴
- **質問スタイル**: どのような質問を好むか
- **理解方法**: 例え話、具体例、理論的説明のどれが効果的か
- **学習ペース**: 急ぐタイプか、じっくり考えるタイプか

## 🔍 学習の深まりポイント
### 重要な転換点
- **理解の突破口**: 学習者が「なるほど！」と感じた瞬間
- **疑問の解決**: 最初の疑問が解決された場面
- **新しい視点**: 学習者が新しい角度から考えるようになった点

### 学習者の成長
- **知識の統合**: 断片的な知識がつながった瞬間
- **応用力の向上**: 学んだことを別の文脈で使えるようになった点
- **自信の変化**: 学習に対する自信の変化

## 📖 資料との関連性分析
### 資料が活かされた部分
- **資料の内容が理解を助けた場面**
- **資料の具体例が効果的だった部分**
- **資料の情報が疑問解決に役立った点**

### 資料を超えた学習
- **学習者が資料以上の洞察を得た部分**
- **資料の内容を批判的に検討した場面**
- **資料にない視点を追加した発言**

## 🚀 学習者の強みと改善点
### 学習者の強み
- **優れている点**: 会話から見える学習者の得意分野
- **学習意欲**: 継続的に学ぼうとする姿勢
- **思考の特徴**: 論理的思考、創造的思考などの特徴

### 改善すべき点
- **理解の穴**: まだ明確でない概念や理解不足の部分
- **学習方法**: より効果的な学習アプローチの提案
- **応用力**: 実践的な応用能力の向上点

## 📈 次回学習への具体的提案
### 優先的に取り組むべき内容
- **理解を深めるべき分野**: 今回の会話で不十分だった部分
- **関連学習**: 今回の学習と関連する追加分野
- **実践課題**: 学んだ内容を実際に試すための課題

### 学習方法の改善提案
- **質問の質向上**: より効果的な質問方法
- **理解の確認方法**: 自分の理解を確実にする方法
- **学習の継続性**: 今回の学習を活かすための継続方法

## 🎉 総合評価と振り返り
### 今日の学習の価値
- **最も印象的だった学び**: 学習者にとって最も価値があった点
- **学習の質**: 今回の学習セッションの質的評価
- **継続への意欲**: 今後の学習継続への影響

### 学習者へのメッセージ
- **励まし**: 学習者の努力と成長を認めるメッセージ
- **期待**: 今後の学習への期待と応援
- **アドバイス**: 学習を続けるための具体的なアドバイス

文字数制限：合計2500文字以内で作成してください。会話の具体的な内容を引用しながら、学習者の理解度と成長を詳細に分析してください。資料の内容は補助的な情報として扱い、学習者の会話と反応を中心に据えてください。`

    console.log('Calling OpenAI API for conversation-centered review generation...')
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
            content: 'あなたは学習支援の専門家です。学習者の会話内容を詳細に分析し、学習者の理解度、成長、学習スタイルを中心とした包括的なレビューを作成してください。資料の内容は参考情報として扱い、学習者の実際の会話と反応から読み取れる理解度と学習プロセスを重視してください。学習者の質問の質、理解の深まり、興味の焦点、困難な点を具体的に分析し、次回の学習に直結する実践的な提案を提供してください。'
          },
          {
            role: 'user',
            content: reviewPrompt
          }
        ],
        max_tokens: 2500,
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

    // Create enhanced summary for the review
    const summaryPrompt = `以下の会話中心のレビュー内容を150文字以内で要約し、学習者の成長と学びの核心を表現してください：

${reviewContent}

要約では以下の要素を含めてください：
- 学習者の主な成長点
- 最も印象的だった学び
- 次回への期待`

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
        max_tokens: 150,
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

    // Get user information from the session
    const { data: sessionData } = await supabase
      .from('sessions')
      .select('user_id')
      .eq('id', conversationId)
      .single()

    // Save review to database
    console.log('Saving enhanced review to database...')
    const { data: savedReview, error: saveError } = await supabase
      .from('reviews')
      .insert({
        title,
        content: reviewContent,
        summary,
        ai_generated: true,
        conversation_id: conversationId,
        file_id: fileId || null,
        user_id: sessionData?.user_id || null // Use the same user_id as the session
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
      console.log('Enhanced review saved successfully:', savedReview?.id)
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
    console.error('Error generating enhanced review:', error)
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