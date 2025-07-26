'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  ArrowLeft, 
  Save, 
  Edit3, 
  Brain,
  Calendar,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Sparkles
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'

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
  id: string
  theme: string
  structure: {
    categories: MECECategory[]
  }
  created_at: string
  updated_at: string
}

export default function MECEDetailPage() {
  const [map, setMap] = useState<MECEMap | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [supabase, setSupabase] = useState<any>(null)
  const router = useRouter()
  const params = useParams()
  const mapId = params.id as string

  useEffect(() => {
    try {
      const client = createClient()
      setSupabase(client)
    } catch (error) {
      console.error('Failed to create Supabase client:', error)
    }
  }, [])

  useEffect(() => {
    if (supabase && mapId) {
      loadMECEMap()
    }
  }, [supabase, mapId])

  const loadMECEMap = async () => {
    if (!supabase || !mapId) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const userId = user?.id || null

      let query = supabase
        .from('mece_maps')
        .select('*')
        .eq('id', mapId)

      // ユーザーが認証されている場合はuser_idでフィルタリング、そうでなければnullでフィルタリング
      if (userId) {
        query = query.eq('user_id', userId)
      } else {
        query = query.is('user_id', null)
      }

      const { data, error } = await query.single()

      if (error) {
        console.error('Error loading MECE map:', error)
        router.push('/mece')
      } else {
        // 読み込んだデータをログ出力
        console.log('Loaded MECE map structure:', JSON.stringify(data.structure, null, 2))
        console.log('Categories count:', data.structure.categories.length)
        data.structure.categories.forEach((cat: MECECategory, index: number) => {
          console.log(`Category ${index + 1}:`, {
            name: cat.name,
            description: cat.description,
            aiCountermeasures: cat.countermeasures.ai,
            userCountermeasure: cat.countermeasures.user
          })
        })
        setMap(data)
        // 全てのカテゴリを展開
        const categoryIds = data.structure.categories.map((cat: MECECategory) => cat.id)
        setExpandedCategories(new Set(categoryIds))
      }
    } catch (error) {
      console.error('Error loading MECE map:', error)
      router.push('/mece')
    } finally {
      setIsLoading(false)
    }
  }

  const saveMECEMap = async () => {
    if (!map || !supabase) return

    setIsSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const userId = user?.id || null

      // 保存前のデータをログ出力
      console.log('Saving MECE map structure:', JSON.stringify(map.structure, null, 2))

      let query = supabase
        .from('mece_maps')
        .update({
          theme: map.theme,
          structure: map.structure,
          updated_at: new Date().toISOString()
        })
        .eq('id', map.id)

      // ユーザーが認証されている場合はuser_idでフィルタリング、そうでなければnullでフィルタリング
      if (userId) {
        query = query.eq('user_id', userId)
      } else {
        query = query.is('user_id', null)
      }

      const { error } = await query

      if (error) {
        console.error('Save error:', error)
        alert('Failed to save MECE analysis')
      } else {
        alert('MECE analysis saved successfully')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save MECE analysis')
    } finally {
      setIsSaving(false)
    }
  }

  const updateCategory = (categoryId: string, field: 'name' | 'description', value: string) => {
    if (!map) return

    setMap(prev => {
      if (!prev) return prev
      return {
        ...prev,
        structure: {
          categories: prev.structure.categories.map(cat =>
            cat.id === categoryId ? { ...cat, [field]: value } : cat
          )
        }
      }
    })
  }

  const updateUserCountermeasure = (categoryId: string, value: string) => {
    if (!map) return

    setMap(prev => {
      if (!prev) return prev
      return {
        ...prev,
        structure: {
          categories: prev.structure.categories.map(cat =>
            cat.id === categoryId
              ? { ...cat, countermeasures: { ...cat.countermeasures, user: value } }
              : cat
          )
        }
      }
    })
  }

  // AI対策を生成する関数
  const generateCountermeasures = async (categoryId: string, categoryName: string, categoryDescription: string) => {
    if (!map) return

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
        throw new Error('Failed to generate countermeasures')
      }

      const data = await response.json()
      const countermeasures = data.countermeasures || []

      // 生成された対策をカテゴリーに追加
      setMap(prev => {
        if (!prev) return prev
        return {
          ...prev,
          structure: {
            categories: prev.structure.categories.map(cat =>
              cat.id === categoryId
                ? { ...cat, countermeasures: { ...cat.countermeasures, ai: countermeasures } }
                : cat
            )
          }
        }
      })
    } catch (error) {
      console.error('Error generating countermeasures:', error)
      alert('Failed to generate countermeasures')
    }
  }



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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!map) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Brain className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            MECE Analysis Not Found
          </h3>
          <p className="text-gray-600 mb-4">
            The specified analysis does not exist or you don't have access permission
          </p>
          <Button
            onClick={() => router.push('/mece')}
            className="bg-sky-600 hover:bg-sky-700 text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to List
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/mece')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to List
              </Button>
              <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl flex items-center justify-center shadow-sm">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  MECE Analysis Detail
                </h1>
                <p className="text-sm text-gray-600">
                  Edit structured thinking process
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={saveMECEMap}
                disabled={isSaving}
                className="bg-sky-600 hover:bg-sky-700 text-white transition-all duration-200 shadow-sm"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Theme Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-sky-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Analysis Theme</h2>
          </div>
          <Input
            value={map.theme}
            onChange={(e) => setMap(prev => prev ? { ...prev, theme: e.target.value } : null)}
            placeholder="Enter analysis theme..."
            className="text-lg border-gray-200 focus:border-sky-400"
          />
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(map.created_at)}
            </div>
            {map.updated_at !== map.created_at && (
              <div className="flex items-center gap-1">
                <span>•</span>
                Updated: {formatDate(map.updated_at)}
              </div>
            )}
          </div>
        </div>

        {/* Categories Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center">
              <CheckSquare className="h-4 w-4 text-sky-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Categories and Countermeasures</h2>
          </div>

          {map.structure.categories.map((category, index) => (
            <Card key={category.id} className="border-2 border-gray-100 hover:border-sky-200 transition-all duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleCategoryExpansion(category.id)}
                      className="p-1 hover:bg-sky-50"
                    >
                      {expandedCategories.has(category.id) ? (
                        <ChevronDown className="h-4 w-4 text-sky-600" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-sky-600" />
                      )}
                    </Button>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-sky-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-sky-700">{index + 1}</span>
                      </div>
                      <h4 className="font-medium text-gray-900">
                        {category.name}
                      </h4>
                    </div>
                  </div>
                </div>
              </CardHeader>

              {expandedCategories.has(category.id) && (
                <CardContent className="space-y-4">
                  {/* Debug Information */}
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                    <h6 className="text-sm font-medium text-yellow-800 mb-2">Debug Info:</h6>
                    <div className="text-xs text-yellow-700 space-y-1">
                      <div>Category ID: {category.id}</div>
                      <div>AI Countermeasures Count: {category.countermeasures?.ai?.length || 0}</div>
                      <div>User Countermeasure Length: {category.countermeasures?.user?.length || 0}</div>
                      <div>AI Countermeasures: {JSON.stringify(category.countermeasures?.ai || [])}</div>
                      <div>User Countermeasure: {category.countermeasures?.user || 'empty'}</div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category Name
                    </label>
                    <Input
                      value={category.name}
                      onChange={(e) => updateCategory(category.id, 'name', e.target.value)}
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
                      onChange={(e) => updateCategory(category.id, 'description', e.target.value)}
                      placeholder="Enter category description"
                      className="border-gray-200 focus:border-sky-400"
                    />
                  </div>

                  {/* Countermeasures Section */}
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1 h-1 bg-sky-400 rounded-full"></div>
                      <h5 className="text-sm font-medium text-gray-700">Countermeasures</h5>
                    </div>

                    {/* User Countermeasure Input - デフォルトで表示 */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        💭 My Countermeasures
                      </label>
                      <Textarea
                        value={category.countermeasures.user}
                        onChange={(e) => updateUserCountermeasure(category.id, e.target.value)}
                        placeholder="Think and enter your countermeasures for this category..."
                        className="min-h-[100px] border-gray-200 focus:border-green-400"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        💡 Thinking for yourself improves your thinking skills
                      </p>
                    </div>

                    {/* AI Countermeasures - 参考として表示 */}
                    {category.countermeasures.ai && category.countermeasures.ai.length > 0 ? (
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Brain className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-600">AI Reference (for reference only)</span>
                        </div>
                        <div className="max-h-32 overflow-y-auto">
                          <ul className="text-sm text-gray-600 space-y-1">
                            {category.countermeasures.ai.map((countermeasure, aiIndex) => (
                              <li key={aiIndex} className="flex items-start gap-2">
                                <span className="text-gray-400 mt-1">•</span>
                                <span className="italic">{countermeasure}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          ※ These are reference suggestions. Please prioritize your own thoughts.
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Brain className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-600">AI Reference</span>
                        </div>
                        <p className="text-xs text-gray-400">
                          No AI countermeasures generated yet. Click "AI Countermeasure Suggestion" to generate.
                        </p>
                      </div>
                    )}


                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
} 