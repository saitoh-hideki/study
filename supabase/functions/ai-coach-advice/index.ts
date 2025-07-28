import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({
        error: 'No authorization header'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return new Response(JSON.stringify({
        error: 'Invalid authorization header'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    const { reviewContent, reviewId } = await req.json();
    
    if (!reviewContent || !reviewId) {
      return new Response(JSON.stringify({
        error: 'Review content and review ID are required'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({
        error: '環境変数の設定が不足しています'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return new Response(JSON.stringify({
        error: 'OpenAI API key is missing'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Analyze review content and generate suggestions
    const systemPrompt = `あなたは学習支援の専門家です。
レビュー内容を分析して、学習者に最適な次の学習ステップを提案してください。

提案する機能：
1. 5 Whys Analysis - 課題の根本原因を深掘り
2. MECE Analysis - 概念を体系的に整理
3. Book Builder - 知識を本として体系化
4. Thinking Image - 概念を視覚的に表現

レビュー内容から以下を分析してください：
- 学習者の理解度レベル
- 興味を持った分野
- 課題や疑問点
- 深掘りすべき内容

各機能について、なぜその機能が適しているかを具体的に説明し、3つの具体的な分析テーマを提案してください。

以下のJSON形式で回答してください：
{
  "fiveWhys": {
    "suggested": true/false,
    "reason": "提案理由",
    "topics": [
      "分析テーマ1",
      "分析テーマ2", 
      "分析テーマ3"
    ]
  },
  "mece": {
    "suggested": true/false,
    "reason": "提案理由",
    "topics": [
      "分析テーマ1",
      "分析テーマ2",
      "分析テーマ3"
    ]
  },
  "bookBuilder": {
    "suggested": true/false,
    "reason": "提案理由",
    "topics": [
      "本のタイトル1",
      "本のタイトル2",
      "本のタイトル3"
    ]
  },
  "thinkingImage": {
    "suggested": true/false,
    "reason": "提案理由",
    "topics": [
      "可視化テーマ1",
      "可視化テーマ2",
      "可視化テーマ3"
    ]
  }
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
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
            content: `以下のレビュー内容を分析して、学習者に最適な次の学習ステップを提案してください：\n\n${reviewContent}`
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      return new Response(JSON.stringify({
        error: 'Failed to generate AI coach advice'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content || '';

    // Parse JSON response
    let suggestions;
    try {
      suggestions = JSON.parse(content);
    } catch (error) {
      console.error('Failed to parse OpenAI response:', error);
      // Fallback suggestions
      suggestions = {
        fiveWhys: {
          suggested: true,
          reason: 'レビュー内容から課題や疑問点が見つかりました。根本原因を深掘りしてみましょう。',
          topics: [
            '学習内容の理解度の課題',
            '学習方法の改善点',
            '知識の応用における課題'
          ]
        },
        mece: {
          suggested: true,
          reason: '複数の概念や観点について学ばれています。体系的に整理してみましょう。',
          topics: [
            '学習内容の分類整理',
            '概念間の関係性分析',
            '知識の階層構造化'
          ]
        },
        bookBuilder: {
          suggested: true,
          reason: '深い理解を深められました。この知識を本として体系化してみましょう。',
          topics: [
            '学習内容の体系化',
            '実践的な知識の整理',
            '学習成果のまとめ'
          ]
        },
        thinkingImage: {
          suggested: true,
          reason: '抽象的な概念について理解されました。視覚的に表現してみましょう。',
          topics: [
            '概念の可視化',
            '学習プロセスの図解',
            '知識構造の視覚表現'
          ]
        }
      };
    }

    return new Response(JSON.stringify(suggestions), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}); 