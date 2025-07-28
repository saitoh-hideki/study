'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Plus, Minus, Save, Loader2, Brain } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface FiveWhyLevel {
  id?: string
  level_number: number
  question: string
  answer: string
}

interface FiveWhyTree {
  id?: string
  topic: string
  root_cause?: string
  insights?: any
  levels: FiveWhyLevel[]
}

interface FiveWhyModalProps {
  isOpen: boolean
  onClose: () => void
  conversationId?: string
  initialTopic?: string
}

export default function FiveWhyModal({ isOpen, onClose, conversationId, initialTopic }: FiveWhyModalProps) {
  const [tree, setTree] = useState<FiveWhyTree>({
    topic: initialTopic || '',
    levels: [
      { level_number: 1, question: '', answer: '' },
      { level_number: 2, question: '', answer: '' },
      { level_number: 3, question: '', answer: '' },
      { level_number: 4, question: '', answer: '' },
      { level_number: 5, question: '', answer: '' }
    ]
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [currentLevel, setCurrentLevel] = useState(1)

  const supabase = createClient()

  useEffect(() => {
    if (isOpen && initialTopic) {
      setTree(prev => ({ ...prev, topic: initialTopic }))
    }
  }, [isOpen, initialTopic])

  const generateQuestion = async (level: number, previousAnswer?: string) => {
    if (!tree.topic) return

    setIsLoading(true)
    try {
      const prompt = `以下のトピックについて、5ホワイ分析の${level}番目の質問を生成してください。

トピック: ${tree.topic}
${previousAnswer ? `前の回答: ${previousAnswer}` : ''}

${level}番目の「なぜ？」の質問を1つだけ生成してください。質問のみを返してください。`

      const response = await fetch('/api/generate-ai-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: prompt,
          conversationId: conversationId,
          difficulty: 'normal',
        }),
      })

      if (!response.ok) {
        throw new Error('質問の生成に失敗しました')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('レスポンスが読み取れません')
      }

      let question = ''
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              break
            }

            try {
              const parsed = JSON.parse(data)
              if (parsed.content) {
                question += parsed.content
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
      }

      setTree(prev => ({
        ...prev,
        levels: prev.levels.map(level => 
          level.level_number === currentLevel 
            ? { ...level, question: question.trim() }
            : level
        )
      }))

    } catch (error) {
      console.error('質問生成エラー:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveTree = async () => {
    if (!tree.topic || !conversationId) return

    setIsSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      // Create five_why_tree
      const { data: treeData, error: treeError } = await supabase
        .from('five_why_trees')
        .insert({
          user_id: user?.id || null,
          conversation_id: conversationId,
          topic: tree.topic,
          root_cause: tree.root_cause,
          insights: tree.insights
        })
        .select()
        .single()

      if (treeError) {
        throw treeError
      }

      // Create five_why_levels
      const levelsToInsert = tree.levels
        .filter(level => level.question && level.answer)
        .map(level => ({
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
          throw levelsError
        }
      }

      onClose()
    } catch (error) {
      console.error('保存エラー:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const updateLevel = (levelNumber: number, field: 'question' | 'answer', value: string) => {
    setTree(prev => ({
      ...prev,
      levels: prev.levels.map(level => 
        level.level_number === levelNumber 
          ? { ...level, [field]: value }
          : level
      )
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">5ホワイ分析</h2>
            <p className="text-sm text-gray-600">問題の根本原因を深掘りする</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Topic Input */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">分析トピック</CardTitle>
                <CardDescription>
                  分析したい問題やトピックを入力してください
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  value={tree.topic}
                  onChange={(e) => setTree(prev => ({ ...prev, topic: e.target.value }))}
                  placeholder="例: プロジェクトが遅れている"
                  className="text-lg"
                />
              </CardContent>
            </Card>

            {/* Five Why Levels */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">5ホワイ分析</h3>
              
              {tree.levels.map((level, index) => (
                <Card key={level.level_number} className="border-2 border-gray-100">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                          {level.level_number}
                        </div>
                        <CardTitle className="text-base">なぜ？</CardTitle>
                      </div>
                      {currentLevel === level.level_number && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generateQuestion(level.level_number, index > 0 ? tree.levels[index - 1].answer : undefined)}
                          disabled={isLoading || !tree.topic}
                          className="text-xs"
                        >
                          {isLoading ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Brain className="h-3 w-3 mr-1" />
                          )}
                          AI質問生成
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        質問
                      </label>
                      <Input
                        value={level.question}
                        onChange={(e) => updateLevel(level.level_number, 'question', e.target.value)}
                        placeholder={`${level.level_number}番目の「なぜ？」の質問`}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        回答
                      </label>
                      <Input
                        value={level.answer}
                        onChange={(e) => updateLevel(level.level_number, 'answer', e.target.value)}
                        placeholder="あなたの回答を入力してください"
                        className="text-sm"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Root Cause */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">根本原因</CardTitle>
                <CardDescription>
                  5ホワイ分析の結果、特定された根本原因を記録してください
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  value={tree.root_cause || ''}
                  onChange={(e) => setTree(prev => ({ ...prev, root_cause: e.target.value }))}
                  placeholder="根本原因を入力してください"
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            キャンセル
          </Button>
          <Button
            onClick={saveTree}
            disabled={isSaving || !tree.topic}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                保存
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
} 