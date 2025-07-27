'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Plus, Minus, Save, Loader2, MessageSquare, HelpCircle, Target, Sparkles, Brain } from 'lucide-react'
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
      { level_number: 4, question: '', answer: '' },
      { level_number: 5, question: '', answer: '' }
    ]
  })
  const [isStarted, setIsStarted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [streamingQuestions, setStreamingQuestions] = useState<{ [key: number]: string }>({})
  const [activeLevel, setActiveLevel] = useState<number>(0)

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
          { level_number: 4, question: '', answer: '' },
          { level_number: 5, question: '', answer: '' }
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
    if (!tree.topic.trim()) return

    setIsStarted(true)
    setActiveLevel(1)
    setStreamingQuestions({})
    
    // 最初のレベルに自動スクロール
    setTimeout(() => {
      const firstLevel = document.getElementById('level-1')
      if (firstLevel) {
        firstLevel.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)

    // 最初の質問をストリーミング形式で表示
    setTimeout(() => {
      generateStreamingQuestion(1)
    }, 300)
  }

  // 質問をストリーミング形式で生成
  const generateStreamingQuestion = async (levelNumber: number) => {
    if (!tree.topic.trim()) return

    setActiveLevel(levelNumber)
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

      // スクロールをアクティブレベルに移動
      setTimeout(() => {
        const activeElement = document.getElementById(`level-${levelNumber}`)
        if (activeElement) {
          activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)

    } catch (error) {
      console.error('質問生成エラー:', error)
      setStreamingQuestions(prev => ({ ...prev, [levelNumber]: 'Error generating question' }))
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
    if (currentLevel < 5) {
      const nextLevel = currentLevel + 1
      generateStreamingQuestion(nextLevel)
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-sky-600 rounded-2xl flex items-center justify-center shadow-sm">
              <HelpCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-sky-600">5 Whys Analysis</h2>
              <p className="text-sm text-gray-600">Deep dive into the root cause of problems</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-8 overflow-y-auto max-h-[calc(95vh-200px)]">
          <div className="space-y-8">
            {/* Topic Input */}
            <Card className="border-2 border-gray-100 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center">
                    <Target className="h-4 w-4 text-sky-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Analysis Topic</CardTitle>
                    <CardDescription>
                      Enter the challenge or problem you want to analyze
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Input
                  value={tree.topic}
                  onChange={(e) => setTree(prev => ({ ...prev, topic: e.target.value }))}
                  placeholder="Sales are not increasing"
                  className="text-lg border-gray-200 focus:border-sky-400 focus:ring-sky-400"
                />
              </CardContent>
            </Card>

            {/* Start Button */}
            {!isStarted && (
              <div className="flex justify-center">
                <Button
                  onClick={startAnalysis}
                  disabled={!tree.topic.trim()}
                  className="px-10 py-4 text-lg font-semibold bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white rounded-2xl shadow-lg transition-all duration-200 transform hover:scale-105"
                >
                  <Sparkles className="h-5 w-5 mr-3" />
                  Start Analysis
                </Button>
              </div>
            )}

            {/* Five Why Levels */}
            {isStarted && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center">
                    <HelpCircle className="h-4 w-4 text-sky-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">5 Whys Analysis Process</h3>
                </div>
                
                {tree.levels.map((level, index) => (
                  <Card key={level.level_number} className="border-2 border-gray-100 hover:border-sky-200 transition-all duration-200 shadow-sm" id={`level-${level.level_number}`}>
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-lg">Why?</CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Question
                        </label>
                        <div className="text-sm text-gray-900 bg-gray-50 p-4 rounded-lg border border-gray-200 leading-relaxed">
                          {streamingQuestions[level.level_number] ? (
                            <>
                              {streamingQuestions[level.level_number]}
                              <span className="animate-pulse text-sky-600">▋</span>
                            </>
                          ) : (
                            index === 0 
                              ? (tree.topic.trim() 
                                  ? `Why is ${tree.topic}?`
                                  : '分析したい課題を入力してください')
                              : 'Enter your answer and press the "Why!" button'
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Answer
                        </label>
                        <div className="flex gap-3">
                          <Input
                            value={level.answer}
                            onChange={(e) => updateLevel(level.level_number, 'answer', e.target.value)}
                            placeholder="Enter your answer"
                            className="text-sm flex-1 border-gray-200 focus:border-sky-400 focus:ring-sky-400"
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
                            className="bg-sky-600 hover:bg-sky-700 text-white rounded-xl px-4"
                          >
                            Why!
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Root Cause */}
                <Card className="border-2 border-gray-100 shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center">
                        <Brain className="h-4 w-4 text-sky-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Root Cause</CardTitle>
                        <CardDescription>
                          Root cause automatically identified from 5 Whys analysis
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-900 bg-gray-50 p-4 rounded-lg border border-gray-200 leading-relaxed">
                      {tree.root_cause || 'Will be automatically set when you enter answers'}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-8 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl"
          >
            Cancel
          </Button>
          {onSendToChat && isStarted && (
            <Button
              variant="outline"
              onClick={sendToChat}
              disabled={isSaving || !tree.topic.trim()}
              className="border-green-300 text-green-700 hover:bg-green-50 rounded-xl"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Send to Chat
            </Button>
          )}
          <Button
            onClick={saveTree}
            disabled={isSaving || !tree.topic.trim() || !isStarted || tree.levels.filter(level => level.answer.trim()).length === 0}
            className="bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-sm"
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