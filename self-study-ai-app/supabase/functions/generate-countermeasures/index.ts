import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { theme, category, description } = await req.json()

    if (!theme || !category) {
      return new Response(
        JSON.stringify({ error: 'Theme and category are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

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

    const prompt = `以下のテーマとカテゴリに対する具体的で実行可能な対策を3-5個提案してください。

テーマ: ${theme}
カテゴリ: ${category}
説明: ${description || '説明なし'}

対策の要件:
1. 具体的で実行可能（曖昧な提案ではなく）
2. 実用的で実装可能
3. このカテゴリの特定の課題や問題に対処
4. 短期的および長期的な解決策を考慮
5. 測定可能な成果に焦点を当てる

回答形式: 以下のJSON配列のみを返してください。他のテキストや説明、記号、ラベルは一切含めないでください。

["対策1", "対策2", "対策3"]

重要: 
- 回答は上記のJSON配列のみ
- ラベルや説明文は含めない
- 箇条書き記号（•、*、-）は含めない
- 引用符（"）は含めない
- JSONや...などの記号は含めない
- 配列の前後に余分なテキストは含めない
- 各対策は日本語で、具体的で実行可能な内容にしてください
- 必ず有効なJSON配列のみを返してください`

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
            content: 'あなたは戦略的計画と組織改善を専門とする問題解決の専門家です。MECE分析で特定されたビジネス課題に対して、具体的で実行可能な対策を提供することがあなたの任務です。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 800
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      throw new Error('No content received from OpenAI')
    }

    console.log('OpenAI countermeasures response:', content)
    console.log('Response length:', content.length)
    console.log('Response lines:', content.split('\n').length)

    // 超シンプルな解析処理
    let countermeasures: string[] = []
    
    try {
      // まずJSON配列を探す
      const jsonMatch = content.match(/\[.*\]/m)
      if (jsonMatch) {
        countermeasures = JSON.parse(jsonMatch[0])
      } else {
        // JSONが見つからない場合は、行ごとに分割して配列を作成
        const lines = content.split('\n')
        
        for (const line of lines) {
          let trimmedLine = line.trim()
          
          // 空行をスキップ
          if (!trimmedLine) {
            continue
          }
          
          // 不要な行をスキップ
          if (trimmedLine === '...' || 
              trimmedLine === 'json' || 
              trimmedLine === '"json' ||
              trimmedLine === '```json' ||
              trimmedLine === '```' ||
              trimmedLine.startsWith('[') || 
              trimmedLine.startsWith(']') ||
              trimmedLine.match(/^[•*\-\[\]{}()\.]+$/) ||
              trimmedLine.includes('json') ||
              trimmedLine.includes('...')) {
            continue
          }
          
          // 超シンプルなクリーニング処理
          // 1. 引用符で囲まれた内容を抽出
          const quotedMatch = trimmedLine.match(/^["""](.*?)["""]$/)
          if (quotedMatch) {
            trimmedLine = quotedMatch[1]
          }
          
          // 2. 箇条書き記号を除去
          trimmedLine = trimmedLine.replace(/^[•*\-]\s*/, '')
          
          // 3. 数字+ドットを除去
          trimmedLine = trimmedLine.replace(/^[\d\.]+\s*/, '')
          
          // 4. 最終的なトリム
          trimmedLine = trimmedLine.trim()
          
          // 有効な内容の場合のみ追加
          if (trimmedLine.length > 0 && 
              !trimmedLine.match(/^[•*\-\[\]{}()\.]/) &&
              !trimmedLine.includes('json') &&
              !trimmedLine.includes('...') &&
              trimmedLine.length > 5) { // 最低5文字以上
            countermeasures.push(trimmedLine)
          }
          
          // 最大5個まで
          if (countermeasures.length >= 5) {
            break
          }
        }
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      // エラーの場合は空配列を返す
      countermeasures = []
    }

    // Validate countermeasures
    if (!Array.isArray(countermeasures) || countermeasures.length === 0) {
      throw new Error('No valid countermeasures generated')
    }

    console.log('Final countermeasures:', countermeasures)

    return new Response(
      JSON.stringify({
        success: true,
        countermeasures
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 