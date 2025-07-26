import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { bookTitle, introduction, chapters, conversationId } = await request.json()

    if (!chapters || chapters.length === 0) {
      return NextResponse.json(
        { error: '章構成が必要です' },
        { status: 400 }
      )
    }

    // TODO: OpenAI APIを使用して下書きを生成
    // 現在はプレースホルダーとして既存の章を拡張
    const enhancedChapters = chapters.map((chapter: any, index: number) => ({
      ...chapter,
      content: `${chapter.content}\n\nこの章では、学習者が理解した内容をより詳しく説明し、実践的な例を交えて解説します。具体的な応用例や、実際の場面での活用方法についても触れていきます。`
    }))

    return NextResponse.json({
      chapters: enhancedChapters
    })

  } catch (error) {
    console.error('Error in generate-book-draft API:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
} 