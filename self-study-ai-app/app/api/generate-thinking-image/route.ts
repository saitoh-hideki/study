import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { prompt, conversationId, style } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'プロンプトが必要です' },
        { status: 400 }
      )
    }

    // TODO: DALL-E APIまたは他の画像生成APIを使用
    // 現在はプレースホルダーとしてサンプル画像URLを返す
    const sampleImageUrl = 'https://via.placeholder.com/512x512/6366f1/ffffff?text=Thinking+Image'

    return NextResponse.json({
      imageUrl: sampleImageUrl
    })

  } catch (error) {
    console.error('Error in generate-thinking-image API:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
} 