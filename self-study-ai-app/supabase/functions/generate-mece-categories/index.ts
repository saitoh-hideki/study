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
    const { theme } = await req.json()

    if (!theme) {
      return new Response(
        JSON.stringify({ error: 'Theme is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // OpenAI API call to generate MECE categories using GPT-4o
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `あなたはMECE（Mutually Exclusive, Collectively Exhaustive）分析の専門家です。

MECE分析の目的：
与えられた問題や課題の原因・要因を、モレなく・ダブりなく（MECE）の原則で包括的に分析することです。

MECE分析の原則：
1. 相互排他（Mutually Exclusive）：原因・要因間に重複がない
2. 全体網羅（Collectively Exhaustive）：問題の全原因・要因をカバーしている

分析のアプローチ：
- 問題の根本原因を探る
- 異なる視点・次元から原因を分析
- 原因の階層構造を整理
- 実用的で対策可能な要因に焦点

例：
テーマ「人材不足」の場合：
- 需要要因（求人数増加、新規事業拡大、経済成長など）
- 供給要因（少子化、転職増加、スキル不足、教育制度など）
- 制度的要因（労働規制、雇用制度、社会保障など）
- 経済的要因（景気、賃金水準、物価など）
- 社会的要因（働き方変化、価値観変化、ライフスタイルなど）

このように、問題の原因を異なる視点から包括的に分析してください。`
          },
          {
            role: 'user',
            content: `テーマ「${theme}」に対してMECE分析を行い、この問題の原因・要因を5-7個のカテゴリで包括的に分析してください。

各カテゴリは異なる視点・次元から原因を分析し、重複を避けてください。

JSON形式で回答してください：
{
  "categories": [
    {
      "name": "原因カテゴリ名",
      "description": "このカテゴリに含まれる原因・要因の説明",
      "children": []
    }
  ]
}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      })
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('OpenAI API error:', openaiResponse.status, errorText)
      throw new Error(`OpenAI API error: ${openaiResponse.status}`)
    }

    const openaiData = await openaiResponse.json()
    const content = openaiData.choices[0]?.message?.content

    if (!content) {
      throw new Error('No content received from OpenAI')
    }

    console.log('OpenAI response:', content)

    // Parse the JSON response from OpenAI
    let parsedContent
    try {
      // Extract JSON from the response (in case there's additional text)
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedContent = JSON.parse(jsonMatch[0])
      } else {
        parsedContent = JSON.parse(content)
      }
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError)
      console.error('Raw content:', content)
      
      // Fallback: create a simple MECE structure based on common business frameworks
      parsedContent = {
        categories: [
          { 
            name: "需要要因", 
            description: "問題の需要側の原因・要因（需要増加、新規需要など）", 
            children: [] 
          },
          { 
            name: "供給要因", 
            description: "問題の供給側の原因・要因（供給不足、能力不足など）", 
            children: [] 
          },
          { 
            name: "制度的要因", 
            description: "制度・ルール・規制に関連する原因・要因", 
            children: [] 
          },
          { 
            name: "経済的要因", 
            description: "経済状況・市場環境に関連する原因・要因", 
            children: [] 
          },
          { 
            name: "社会的要因", 
            description: "社会・文化・価値観に関連する原因・要因", 
            children: [] 
          }
        ]
      }
    }

    // Validate that we have categories
    if (!parsedContent.categories || !Array.isArray(parsedContent.categories) || parsedContent.categories.length === 0) {
      throw new Error('Invalid categories structure received from OpenAI')
    }

    return new Response(
      JSON.stringify({
        success: true,
        categories: parsedContent.categories
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 