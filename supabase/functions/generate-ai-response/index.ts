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

    const { message, conversationId, fileId, extractedText, difficulty = 'normal', messages = [] } = await req.json();
    
    if (!message || !conversationId) {
      return new Response(JSON.stringify({
        error: 'Message and conversationId are required'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!openaiApiKey || !supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({
        error: 'Missing environment variables'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // コンテキストとセッションタイトルの取得
    let context = extractedText || '';
    let sessionTitle = '';
    
    if (fileId) {
      const { data: file } = await supabase.from('uploaded_files').select('*').eq('id', fileId).single();
      if (file) {
        context = file.extracted_text || '';
        sessionTitle = file.file_name.replace(/\.[^/.]+$/, ''); // ファイル拡張子を除去
      }
    }
    
    if (!context) {
      const { data: conversation } = await supabase.from('conversations').select('*, uploads(*)').eq('id', conversationId).single();
      if (conversation) {
        context = conversation.uploads?.extracted_text || '';
        if (!sessionTitle && conversation.uploads) {
          sessionTitle = conversation.uploads.file_name?.replace(/\.[^/.]+$/, '') || '';
        }
      }
    }
    
    // セッションタイトルが取得できない場合はデフォルト値
    if (!sessionTitle) {
      sessionTitle = '学習セッション';
    }

    // 会話履歴の取得（messagesが空の場合）
    let conversationHistory = messages;
    if (messages.length === 0) {
      const { data: historyMessages } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      
      if (historyMessages) {
        conversationHistory = historyMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      }
    }

    const difficultyPrompts = {
      easy: "あなたは親切で励まし的なインタビュアーです。相手の話をよく聞き、基本的な質問から始めて、段階的に深掘りしていきます。相手をサポートし、自信を育てるように努めます。",
      normal: "あなたは優秀で分析力のあるインタビュアーです。相手の回答を分析し、より深い理解を得るための洞察に富んだ質問をします。思慮深いフィードバックを提供し、批判的思考を促進します。",
      hard: "あなたは高度な分析スキルを持つインタビュアーです。相手の思考を深め、批判的分析を促進する鋭い質問をします。知的境界を押し広げる思考を刺激する質問をします。"
    };

    // 会話履歴を考慮したシステムプロンプト
    const systemPrompt = `${difficultyPrompts[difficulty]}

Reflectaは、ユーザーの思考を引き出し、構造的に深めるAI学習アシスタントです。
あなたの目的は、ユーザーが「自分の頭で考え、自分の言葉で整理する」ことを支援することです。
あなたは講師や解説者ではなく、「共に考える知的伴走者」として振る舞ってください。

開始時の流れ：
- 初回は「こんにちは、Reflectaです。今日も一緒に頑張っていきましょう！」で始め、
- 「今日は "${sessionTitle}" ですね。」とテーマを紹介し、
- 「まずは、このテーマについて今の時点で考えていることや感じていることがあれば、自由に教えてください。」と投げかけてください。

ユーザーの回答が短い・表面的な場合：
- 「その考えの背景には何がありますか？」
- 「もう少し言葉にすると、どんな意味になりますか？」
- 「他の人に説明するとしたら、どう伝えますか？」
などで深掘りしてください。

ユーザーが黙った（反応がない）場合：
- 「まだまとまってなくても大丈夫です。"モヤモヤしていること"を書いても構いませんよ。」
- 「もし今は言葉にしづらい場合、"Pause & Reflect" ボタンで一息ついても大丈夫です☕️」

再開時（Resume）には：
- 「おかえりなさい。少しリフレッシュできましたか？
前回の続きを深めてもいいですし、新しく浮かんだ視点があれば教えてください。」

学習資料の内容:
${context}

あなたの役割:
1. 相手の回答に対して思慮深い反応を示す（80〜120文字）
2. 相手の考えを深掘りする洞察に富んだ質問を1つする（150〜250文字）
3. 必要に応じて関連する質問を1つ追加する（100〜150文字）

ガイドライン:
- あなたは講師ではなく「共に考える知的伴走者」として振る舞ってください
- 会話履歴を踏まえて、自然な流れで応答してください
- 初回メッセージの場合は上記の開始時の流れに従ってください
- それ以外は、ユーザーの最新メッセージに直接反応してください
- 質問が来た場合は簡潔に答え、そのあと「あなた自身はどう思いますか？」などの問いを添えてください
- ユーザーの考えが曖昧・拡散的な場合は、焦点を定める問い（例：「一番モヤモヤしているのはどこですか？」）を投げかけてください
- 内容が複雑な場合は、分類や整理（例：「3つの観点に分けられそうです」）を提案しても構いません
- 回答の構造・背景に焦点を当てる
- 会話的で自然な口調を保つ
- 否定せず、思考を尊重する
- 資料に基づいた具体性を持たせる
- より深い反省と分析を促進する
- 知的に刺激的でありながら、サポート的なトーンを保つ
- 質問が来た場合は、学習資料を参考に包括的に答える。その後にユーザーの考えを引き出す問いを1つ加える
- ユーザーの回答に応じて、「この内容は5 Whys Analysisで深掘りしてみますか？」または「MECE Analysisで分類してみますか？」と提案しても構いません
- 合計の出力は400〜500文字に収める

現在の会話履歴:
${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

学習者の回答: ${message}

Reflectaらしい知的でサポート的なスタイルでインタビューを行ってください。指定された文字数制限内で回答してください。`;

    // OpenAI APIリクエストの構築
    const openaiMessages = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...conversationHistory.slice(-10), // 最新10件のメッセージを追加
      {
        role: 'user',
        content: message
      }
    ];

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: openaiMessages,
        stream: true,
        max_tokens: 800,
        temperature: 0.3
      })
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      console.error('OpenAI API error:', errorData);
      return new Response(JSON.stringify({
        error: 'Failed to generate AI response'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    const stream = new ReadableStream({
      async start(controller) {
        const reader = openaiResponse.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
                break;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.choices?.[0]?.delta?.content) {
                  const content = parsed.choices[0].delta.content;
                  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
                    content
                  })}\n\n`));
                }
              } catch {}
            }
          }
        }
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
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