'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  X, 
  Plus, 
  Trash2, 
  Save, 
  MessageSquare, 
  Loader2, 
  ChevronDown, 
  ChevronRight,
  Edit3,
  Brain,
  PenTool,
  Sparkles,
  Target,
  CheckSquare
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { MECEGeneratingSkeleton } from './mece-skeleton'

interface MECECategory {
  id: string
  name: string
  description: string
  countermeasures: {
    ai: string[]
    user: string
  }
}

interface MECEMap {
  id?: string
  theme: string
  structure: {
    categories: MECECategory[]
  }
}

interface MECEModalProps {
  isOpen: boolean
  onClose: () => void
  initialTheme?: string
  onSendToChat?: (summary: string) => void
  onSaveSuccess?: () => void
}

export default function MECEModal({ isOpen, onClose, initialTheme, onSendToChat, onSaveSuccess }: MECEModalProps) {
  const [map, setMap] = useState<MECEMap>({
    theme: '',
    structure: { categories: [] }
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [showCustomInput, setShowCustomInput] = useState<Set<string>>(new Set())
  const [generatingCountermeasures, setGeneratingCountermeasures] = useState<Set<string>>(new Set())
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
      // 初期テーマがある場合は設定、ない場合は空白でスタート
      setMap({
        theme: initialTheme || '',
        structure: { categories: [] }
      })
      setExpandedCategories(new Set())
      setEditingCategory(null)
      setShowCustomInput(new Set())
      setGeneratingCountermeasures(new Set())
    }
  }, [isOpen, initialTheme])

  // カテゴリを生成する関数
  const generateCategories = async () => {
    if (!map.theme.trim()) {
      alert('Please enter a theme')
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-mece-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ theme: map.theme })
      })

      if (!response.ok) {
        throw new Error('Failed to generate categories')
      }

      const data = await response.json()
      if (data.success && data.categories) {
        const categoriesWithIds = data.categories.map((cat: any) => ({
          ...cat,
          id: `cat-${Date.now()}-${Math.random()}`,
          countermeasures: {
            ai: [],
            user: ''
          },
          children: []
        }))
        
        setMap(prev => ({
          ...prev,
          structure: { categories: categoriesWithIds }
        }))
        // カテゴリ生成後は全て折りたたまれた状態にする
        setExpandedCategories(new Set())
      }
    } catch (error) {
      console.error('Error generating categories:', error)
      alert('Failed to generate categories')
    } finally {
      setIsGenerating(false)
    }
  }

  // AI対策提案を生成する関数
  const generateCountermeasures = async (categoryId: string, categoryName: string, categoryDescription: string) => {
    setGeneratingCountermeasures(prev => new Set(prev).add(categoryId))
    
    try {
      const response = await fetch('/api/generate-countermeasures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          theme: map.theme,
          category: categoryName,
          description: categoryDescription
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(`Failed to generate countermeasures: ${errorData.error || response.statusText}`)
      }

      const data = await response.json()
      if (data.success && data.countermeasures) {
        setMap(prev => ({
          ...prev,
          structure: {
            categories: prev.structure.categories.map(cat =>
              cat.id === categoryId
                ? { ...cat, countermeasures: { ...cat.countermeasures, ai: data.countermeasures } }
                : cat
            )
          }
        }))
      } else {
        throw new Error('Invalid response format from countermeasures API')
      }
    } catch (error) {
      console.error('Error generating countermeasures:', error)
      alert(`Failed to generate countermeasures: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setGeneratingCountermeasures(prev => {
        const newSet = new Set(prev)
        newSet.delete(categoryId)
        return newSet
      })
    }
  }

  // カテゴリを追加する関数
  const addCategory = () => {
    const newCategory: MECECategory = {
      id: `cat-${Date.now()}-${Math.random()}`,
      name: '',
      description: '',
      countermeasures: {
        ai: [],
        user: ''
      }
    }
    
    setMap(prev => ({
      ...prev,
      structure: {
        categories: [...prev.structure.categories, newCategory]
      }
    }))
    
    setEditingCategory(newCategory.id)
  }

  // カテゴリを削除する関数
  const removeCategory = (categoryId: string) => {
    setMap(prev => ({
      ...prev,
      structure: {
        categories: prev.structure.categories.filter(cat => cat.id !== categoryId)
      }
    }))
  }

  // カテゴリを更新する関数
  const updateCategory = (categoryId: string, field: 'name' | 'description', value: string) => {
    setMap(prev => ({
      ...prev,
      structure: {
        categories: prev.structure.categories.map(cat =>
          cat.id === categoryId ? { ...cat, [field]: value } : cat
        )
      }
    }))
  }

  // ユーザー対策を更新する関数
  const updateUserCountermeasure = (categoryId: string, value: string) => {
    setMap(prev => ({
      ...prev,
      structure: {
        categories: prev.structure.categories.map(cat =>
          cat.id === categoryId
            ? { ...cat, countermeasures: { ...cat.countermeasures, user: value } }
            : cat
        )
      }
    }))
  }



  // カテゴリの展開/折りたたみを切り替える関数
  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  // MECE分析を保存する関数
  const saveMECEMap = async () => {
    console.log('=== SAVE MECE MAP START ===')
    
    if (!map.theme.trim()) {
      alert('Please enter a theme')
      return
    }

    if (map.structure.categories.length === 0) {
      alert('Please add categories')
      return
    }

    setIsSaving(true)
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { data: { user } } = await supabase.auth.getUser()
      const userId = user?.id || null
      
      console.log('User ID:', userId)
      console.log('Theme:', map.theme)
      console.log('Categories count:', map.structure.categories.length)

      // 保存前のデータをログ出力
      console.log('Saving MECE map structure:', JSON.stringify(map.structure, null, 2))
      
      // 各カテゴリーの対策データを確認
      map.structure.categories.forEach((cat, index) => {
        console.log(`Category ${index + 1}:`, {
          name: cat.name,
          aiCountermeasures: cat.countermeasures?.ai?.length || 0,
          userCountermeasure: cat.countermeasures?.user?.length || 0
        })
      })

      const { data, error } = await supabase
        .from('mece_maps')
        .insert({
          user_id: userId,
          theme: map.theme,
          structure: map.structure
        })
        .select()
        .single()

      if (error) {
        console.error('Save error:', error)
        throw new Error(`Save failed: ${error.message}`)
      }

      console.log('Save successful, returned data:', data)
      alert('MECE analysis saved successfully')
      onClose()
      
      if (onSaveSuccess) {
        onSaveSuccess()
      }
    } catch (error) {
      console.error('Save error:', error)
      alert(`Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  // チャットに送信する関数
  const sendToChat = () => {
    if (!onSendToChat) return

    const summary = `## MECE Analysis Result: ${map.theme}

${map.structure.categories.map((cat, index) => {
  const userCountermeasure = cat.countermeasures.user
    ? `\n  💭 My Countermeasures:\n    ${cat.countermeasures.user}`
    : ''
  
  const aiCountermeasures = cat.countermeasures.ai.length > 0
    ? `\n  🤖 AI Reference:\n    - ${cat.countermeasures.ai.join('\n    - ')}`
    : ''

  return `${index + 1}. **${cat.name}**\n   ${cat.description}${userCountermeasure}${aiCountermeasures}`
}).join('\n\n')}

Through this MECE analysis, I have structurally organized the overall picture of ${map.theme} and thought about countermeasures for each category.`

    onSendToChat(summary)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-sky-600 rounded-2xl flex items-center justify-center shadow-sm">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">MECE Analysis</h2>
              <p className="text-sm text-gray-600">Structurally classify themes and think about countermeasures</p>
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
            {/* Theme Input */}
            <Card className="border-2 border-gray-100 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center">
                    <Target className="h-4 w-4 text-sky-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Analysis Theme</CardTitle>
                    <CardDescription>
                      Enter the theme or issue you want to analyze
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Input
                  value={map.theme}
                  onChange={(e) => setMap(prev => ({ ...prev, theme: e.target.value }))}
                  placeholder="Reasons for declining sales, improving customer satisfaction, business efficiency improvement..."
                  className="text-lg border-gray-200 focus:border-sky-400 focus:ring-sky-400"
                />
              </CardContent>
            </Card>

            {/* Generate Categories Button */}
            <div className="flex justify-center">
              <Button
                onClick={generateCategories}
                disabled={isGenerating || !map.theme.trim()}
                className="px-10 py-4 text-lg font-semibold bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white rounded-2xl shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                    Generating Categories...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-3" />
                    Generate Categories with AI
                  </>
                )}
              </Button>
            </div>

            {/* Categories */}
            {isGenerating ? (
              <MECEGeneratingSkeleton />
            ) : map.structure.categories.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center">
                      <CheckSquare className="h-4 w-4 text-sky-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Categories and Countermeasures</h3>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addCategory}
                    className="text-sky-600 border-sky-200 hover:bg-sky-50 rounded-xl"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </div>

                {map.structure.categories.map((category, index) => (
                  <Card key={category.id} className="border-2 border-gray-100 hover:border-sky-200 transition-all duration-200 shadow-sm">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleCategoryExpansion(category.id)}
                            className="p-2 hover:bg-sky-50 rounded-xl"
                          >
                            {expandedCategories.has(category.id) ? (
                              <ChevronDown className="h-5 w-5 text-sky-600" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-sky-600" />
                            )}
                          </Button>
                          <div 
                            className="flex items-center gap-3 flex-1 cursor-pointer hover:bg-gray-50 p-3 rounded-xl transition-colors"
                            onClick={() => toggleCategoryExpansion(category.id)}
                          >
                            <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-sky-700">{index + 1}</span>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 text-lg">
                                {category.name || 'Enter category name'}
                              </h4>
                              {!expandedCategories.has(category.id) && category.description && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {category.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCategory(category.id)}
                            className="text-red-600 hover:bg-red-50 rounded-xl"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    {/* 展開された場合のみ表示 */}
                    {expandedCategories.has(category.id) && (
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Category Name
                            </label>
                            <Input
                              value={category.name}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateCategory(category.id, 'name', e.target.value)}
                              placeholder="Enter category name"
                              className="border-gray-200 focus:border-sky-400"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Description
                            </label>
                            <Input
                              value={category.description}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateCategory(category.id, 'description', e.target.value)}
                              placeholder="Enter category description"
                              className="border-gray-200 focus:border-sky-400"
                            />
                          </div>
                        </div>

                        {/* Countermeasures Section */}
                        <div className="border-t border-gray-100 pt-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <div className="w-1 h-1 bg-sky-400 rounded-full"></div>
                              <h5 className="text-lg font-semibold text-gray-900">Countermeasures</h5>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => generateCountermeasures(category.id, category.name, category.description)}
                              disabled={generatingCountermeasures.has(category.id)}
                              className="text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl"
                            >
                              {generatingCountermeasures.has(category.id) ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <Brain className="h-4 w-4 mr-2" />
                                  AI Reference
                                </>
                              )}
                            </Button>
                          </div>

                          {/* User Countermeasure Input - デフォルトで表示 */}
                          <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                              💭 My Countermeasures
                            </label>
                            <Textarea
                              value={category.countermeasures.user}
                              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateUserCountermeasure(category.id, e.target.value)}
                              placeholder="Think and enter your countermeasures for this category..."
                              className="min-h-[120px] border-gray-200 focus:border-green-400 focus:ring-green-400 resize-none"
                            />
                            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                              <span className="w-1 h-1 bg-green-400 rounded-full"></span>
                              Thinking for yourself improves your thinking skills. Use AI reference as reference only.
                            </p>
                          </div>

                          {/* AI Countermeasures - 参考として表示 */}
                          {category.countermeasures.ai.length > 0 && (
                            <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-2xl">
                              <div className="flex items-center gap-2 mb-3">
                                <Brain className="h-5 w-5 text-gray-500" />
                                <span className="text-sm font-semibold text-gray-700">AI Reference (for reference only)</span>
                              </div>
                              <div className="max-h-48 overflow-y-auto">
                                <ul className="text-sm text-gray-700 space-y-2">
                                  {category.countermeasures.ai.map((countermeasure, index) => (
                                    <li key={index} className="flex items-start gap-3 p-2 bg-white rounded-lg border border-gray-100">
                                      <span className="text-gray-400 mt-1 text-xs">•</span>
                                      <span className="italic leading-relaxed">{countermeasure}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                These are reference suggestions. Please prioritize your own thoughts.
                              </p>
                            </div>
                          )}


                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}

            {map.structure.categories.length === 0 && (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <CheckSquare className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Categories
                </h3>
                <p className="text-gray-600 mb-4">
                  Press "Generate Categories with AI" button or add categories manually
                </p>
                <Button
                  variant="outline"
                  onClick={addCategory}
                  className="text-sky-600 border-sky-200 hover:bg-sky-50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category Manually
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-8 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-sky-400 rounded-full"></div>
            <span>Organize problems through structured thinking process</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl"
            >
              Cancel
            </Button>
            {onSendToChat && map.structure.categories.length > 0 && (
              <Button
                variant="outline"
                onClick={sendToChat}
                disabled={isSaving || !map.theme.trim()}
                className="border-green-300 text-green-700 hover:bg-green-50 rounded-xl"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Send to Chat
              </Button>
            )}
            <Button
              onClick={saveMECEMap}
              disabled={isSaving || !map.theme.trim() || map.structure.categories.length === 0}
              className="bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white rounded-xl shadow-sm"
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
    </div>
  )
} 