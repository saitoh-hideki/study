import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')

    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get five why trees for the conversation
    const { data: trees, error: treesError } = await supabase
      .from('five_why_trees')
      .select(`
        *,
        five_why_levels (*)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })

    if (treesError) {
      console.error('Error fetching five why trees:', treesError)
      return NextResponse.json({ error: 'Failed to fetch five why trees' }, { status: 500 })
    }

    return NextResponse.json({ trees })
  } catch (error) {
    console.error('Error in five-why API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { topic, conversationId, levels, rootCause } = body

    if (!topic || !conversationId) {
      return NextResponse.json({ error: 'topic and conversationId are required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    // Create five_why_tree
    const { data: treeData, error: treeError } = await supabase
      .from('five_why_trees')
      .insert({
        user_id: user?.id || null,
        conversation_id: conversationId,
        topic: topic,
        root_cause: rootCause,
        insights: null
      })
      .select()
      .single()

    if (treeError) {
      console.error('Error creating five why tree:', treeError)
      return NextResponse.json({ error: 'Failed to create five why tree' }, { status: 500 })
    }

    // Create five_why_levels
    if (levels && levels.length > 0) {
      const levelsToInsert = levels
        .filter((level: any) => level.question && level.answer)
        .map((level: any) => ({
          five_why_tree_id: treeData.id,
          level_number: level.level_number,
          question: level.question,
          answer: level.answer
        }))

      if (levelsToInsert.length > 0) {
        const { error: levelsError } = await supabase
          .from('five_why_levels')
          .insert(levelsToInsert)

        if (levelsError) {
          console.error('Error creating five why levels:', levelsError)
          return NextResponse.json({ error: 'Failed to create five why levels' }, { status: 500 })
        }
      }
    }

    return NextResponse.json({ success: true, treeId: treeData.id })
  } catch (error) {
    console.error('Error in five-why POST API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 