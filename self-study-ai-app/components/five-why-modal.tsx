'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Plus, Minus, Save, Loader2, MessageSquare } from 'lucide-react'
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
  initialTopic?: string
  onSendToChat?: (summary: string) => void
  onSaveSuccess?: () => void
}

export default function FiveWhyModal({ isOpen, onClose, initialTopic, onSendToChat, onSaveSuccess }: FiveWhyModalProps) {
  const [tree, setTree] = useState<FiveWhyTree>({
    topic: '',
    levels: [
      { level_number: 1, question: '', answer: '' },
      { level_number: 2, question: '', answer: '' },
      { level_number: 3, question: '', answer: '' },
      { level_number: 4, question: '', answer: '' }
    ]
  })
  const [isStarted, setIsStarted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [streamingQuestions, setStreamingQuestions] = useState<{ [key: number]: string }>({})

  const [supabase, setSupabase] = useState<any>(null)

  useEffect(() => {
    try {
      const client = createClient()
      setSupabase(client)
    } catch (error) {
      console.error('Failed to create Supabase client:', error)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      // 初期トピックがある場合は設定、ない場合は空白でスタート
      setTree(prev => ({ 
        ...prev, 
        topic: initialTopic || '',
        levels: [
          { level_number: 1, question: '', answer: '' },
          { level_number: 2, question: '', answer: '' },
          { level_number: 3, question: '', answer: '' },
          { level_number: 4, question: '', answer: '' }
        ]
      }))
    }
  }, [isOpen, initialTopic])

  const saveTree = async () => {
    if (!supabase) return

    // トピックが空白の場合は保存できない
    if (!tree.topic.trim()) {
      alert('Please enter an analysis topic')
      return
    }

    setIsSaving(true)
    try {
      // 匿名ユーザーでも保存を許可（認証チェックをスキップ）
      const userId = null
      console.log('Using anonymous user (no auth check)')

      // 回答があるレベルをフィルタリング
      const answeredLevels = tree.levels.filter(level => level.answer.trim())
      
      if (answeredLevels.length === 0) {
        alert('Please enter at least one answer')
        return
      }

      // Create five_why_tree
      const { data: treeData, error: treeError } = await supabase
        .from('five_why_trees')
        .insert({
          user_id: userId,
          conversation_id: null, // conversation_idを常にnullに設定
          topic: tree.topic.trim(),
          root_cause: tree.root_cause || null,
          insights: {}
        })
        .select()
        .single()

      if (treeError) {
        console.error('Tree creation error:', treeError)
        console.error('Tree creation details:', {
          user_id: userId,
          conversation_id: null,
          topic: tree.topic.trim(),
          root_cause: tree.root_cause || null
        })
        throw new Error(`ツリー作成エラー: ${treeError.message}`)
      }

      if (!treeData) {
        throw new Error('Tree data was not created')
      }

      // Create five_why_levels
      const levelsToInsert = answeredLevels.map(level => {
        const question = level.level_number === 1 
                      ? `Why is ${tree.topic}?`
            : `Why is ${tree.levels[level.level_number - 2].answer}?`
        
        return {
          five_why_tree_id: treeData.id,
          level_number: level.level_number,
          question: question,
          answer: level.answer.trim()
        }
      })

      if (levelsToInsert.length > 0) {
        const { error: levelsError } = await supabase
          .from('five_why_levels')
          .insert(levelsToInsert)

        if (levelsError) {
          console.error('Levels creation error:', levelsError)
          throw new Error(`Level creation error: ${levelsError.message}`)
        }
      }

                alert('5 Whys analysis saved successfully')
      onClose()
      // セーブ成功のコールバックを呼び出し
      if (onSaveSuccess) {
        onSaveSuccess()
      }
    } catch (error) {
      console.error('保存エラー:', error)
              alert(`Save failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  // スタートボタンで5ホワイ分析を開始
  const startAnalysis = async () => {
    setIsStarted(true)
    setStreamingQuestions({})
    
    // 最初の質問をストリーミング形式で表示
    setTimeout(() => {
      generateStreamingQuestion(1)
    }, 300)
  }

  // 質問をストリーミング形式で生成
  const generateStreamingQuestion = async (levelNumber: number) => {
    setStreamingQuestions(prev => ({ ...prev, [levelNumber]: '' }))
    
    try {
      let question = ''
      if (levelNumber === 1) {
        question = tree.topic.trim() 
          ? `なぜ${tree.topic}なのですか？`
          : 'Please enter the challenge you want to analyze'
      } else {
        question = `なぜ${tree.levels[levelNumber - 2].answer}なのですか？`
      }

      // ストリーミング効果をシミュレート
      const words = question.split('')
      let currentQuestion = ''
      
      for (let i = 0; i < words.length; i++) {
        currentQuestion += words[i]
        setStreamingQuestions(prev => ({ ...prev, [levelNumber]: currentQuestion }))
        await new Promise(resolve => setTimeout(resolve, 50))
      }
    } catch (error) {
      console.error('質問生成エラー:', error)
    }
  }

  const updateLevel = (levelNumber: number, field: 'question' | 'answer', value: string) => {
    setTree(prev => {
      const updatedLevels = prev.levels.map(level => 
        level.level_number === levelNumber 
          ? { ...level, [field]: value }
          : level
      )
      
      // 最後の回答を自動的に根本原因に設定
      const lastAnsweredLevel = updatedLevels
        .filter(level => level.answer.trim())
        .pop()
      
      const newRootCause = lastAnsweredLevel ? lastAnsweredLevel.answer : prev.root_cause
      
      const result = {
        ...prev,
        levels: updatedLevels,
        root_cause: newRootCause
      }
      
      return result
    })
  }

  // 次の質問を生成する関数
  const generateNextQuestion = (currentLevel: number) => {
    if (currentLevel < 4) {
      generateStreamingQuestion(currentLevel + 1)
    }
  }



  const sendToChat = () => {
    if (!onSendToChat) return

    const answeredLevels = tree.levels.filter(level => level.answer.trim())
    const summary = `5ホワイ分析結果:

課題: ${tree.topic}

${answeredLevels.map(level => {
  const question = level.level_number === 1 
    ? `なぜ${tree.topic}なのですか？`
    : `なぜ${tree.levels[level.level_number - 2].answer}なのですか？`
  return `Q: ${question}\n   A: ${level.answer}`
}).join('\n\n')}

Root Cause: ${tree.root_cause || 'Not identified'}

Let's discuss this analysis result in more detail.`

    onSendToChat(summary)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">5 Whys Analysis</h2>
            <p className="text-sm text-gray-600">Deep dive into the root cause of problems</p>
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

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-6">
            {/* Topic Input */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Analysis Topic</CardTitle>
                <CardDescription>
                  Enter the challenge or problem you want to analyze
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  value={tree.topic}
                  onChange={(e) => setTree(prev => ({ ...prev, topic: e.target.value }))}
                  placeholder="e.g., Sales are not increasing"
                  className="text-lg"
                />
              </CardContent>
            </Card>

            {/* Start Button */}
            {!isStarted && (
              <div className="flex justify-center">
                <Button
                  onClick={startAnalysis}
                  className="px-8 py-3 text-lg font-semibold"
                >
                  Start Analysis
                </Button>
              </div>
            )}

            {/* Five Why Levels */}
            {isStarted && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">5 Whys Analysis</h3>
                
                {tree.levels.map((level, index) => (
                  <Card key={level.level_number} className="border-2 border-gray-100">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-base">Why?</CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Question
                        </label>
                        <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded border">
                          {streamingQuestions[level.level_number] ? (
                            <>
                              {streamingQuestions[level.level_number]}
                              <span className="animate-pulse text-gray-600">▋</span>
                            </>
                          ) : (
                            index === 0 
                              ? (tree.topic.trim() 
                                  ? `Why is ${tree.topic}?`
                                  : 'Please enter the challenge you want to analyze')
                              : 'Enter your answer and press the "Why!" button'
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Answer
                        </label>
                        <div className="flex gap-2">
                          <Input
                            value={level.answer}
                            onChange={(e) => updateLevel(level.level_number, 'answer', e.target.value)}
                            placeholder="Enter your answer"
                            className="text-sm flex-1"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && level.answer.trim()) {
                                generateNextQuestion(level.level_number)
                              }
                            }}
                          />
                          <Button
                            onClick={() => generateNextQuestion(level.level_number)}
                            disabled={!level.answer.trim() || level.level_number >= 4}
                            size="sm"
                            className="bg-sky-500 hover:bg-sky-600 text-white"
                          >
                            Why!
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Root Cause */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Root Cause</CardTitle>
                    <CardDescription>
                      Root cause automatically identified from 5 Whys analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded border">
                      {tree.root_cause || 'Will be automatically set when you enter answers'}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          {onSendToChat && isStarted && (
            <Button
              variant="outline"
              onClick={sendToChat}
              disabled={isSaving || !tree.topic.trim()}
              className="border-green-300 text-green-700 hover:bg-green-50"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Send to Chat
            </Button>
          )}
                      <Button
              onClick={saveTree}
              disabled={isSaving || !tree.topic.trim() || !isStarted || tree.levels.filter(level => level.answer.trim()).length === 0}
              className="bg-sky-600 hover:bg-sky-700"
            >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
} 