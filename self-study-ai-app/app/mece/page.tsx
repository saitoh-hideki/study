'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Trash2, 
  Plus, 
  Calendar, 
  Layers, 
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Brain,
  Sparkles
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface MECECategory {
  id: string
  name: string
  description: string
  children: MECECategory[]
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

export default function MECEPage() {
  const [maps, setMaps] = useState<MECEMap[]>([])
  const [selectedMap, setSelectedMap] = useState<MECEMap | null>(null)
  const [selectedMaps, setSelectedMaps] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [supabase, setSupabase] = useState<any>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const router = useRouter()

  useEffect(() => {
    try {
      const client = createClient()
      setSupabase(client)
    } catch (error) {
      console.error('Failed to create Supabase client:', error)
    }
  }, [])

  useEffect(() => {
    if (supabase) {
      loadMECEMaps()
    }
  }, [supabase])

  const loadMECEMaps = async () => {
    if (!supabase) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const userId = user?.id || null

      let query = supabase
        .from('mece_maps')
        .select('*')
        .order('created_at', { ascending: false })

      // ユーザーが認証されている場合はuser_idでフィルタリング、そうでなければnullでフィルタリング
      if (userId) {
        query = query.eq('user_id', userId)
      } else {
        query = query.is('user_id', null)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error loading MECE maps:', error)
        setMaps([])
      } else {
        setMaps(data || [])
        if (data && data.length > 0 && !selectedMap) {
          setSelectedMap(data[0])
        }
      }
    } catch (error) {
      console.error('Error loading MECE maps:', error)
      setMaps([])
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMapSelection = (mapId: string) => {
    setSelectedMaps(prev => {
      const newSet = new Set(prev)
      if (newSet.has(mapId)) {
        newSet.delete(mapId)
      } else {
        newSet.add(mapId)
      }
      return newSet
    })
  }

  const deleteSelectedMaps = async () => {
    if (selectedMaps.size === 0) return

    if (!window.confirm(`Delete ${selectedMaps.size} MECE analysis? This action cannot be undone.`)) {
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const userId = user?.id || null

      const mapIds = Array.from(selectedMaps)
      let query = supabase
        .from('mece_maps')
        .delete()
        .in('id', mapIds)

      // ユーザーが認証されている場合はuser_idでフィルタリング、そうでなければnullでフィルタリング
      if (userId) {
        query = query.eq('user_id', userId)
      } else {
        query = query.is('user_id', null)
      }

      const { error } = await query

      if (error) {
        console.error('Error deleting maps:', error)
        alert('Failed to delete MECE analysis')
      } else {
        setMaps(prev => prev.filter(map => !selectedMaps.has(map.id)))
        setSelectedMaps(new Set())
        if (selectedMap && selectedMaps.has(selectedMap.id)) {
          setSelectedMap(null)
        }
        alert('Selected MECE analysis deleted successfully')
      }
    } catch (error) {
      console.error('Error deleting maps:', error)
      alert('Failed to delete MECE analysis')
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

  const getCategoryCount = (categories: MECECategory[]): number => {
    return categories.reduce((total, category) => {
      return total + 1 + getCategoryCount(category.children)
    }, 0)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl flex items-center justify-center shadow-sm">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  MECE Analysis History
                </h1>
                <p className="text-sm text-gray-600">
                  Mutually Exclusive, Collectively Exhaustive
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {selectedMaps.size > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deleteSelectedMaps}
                  className="border-red-200 text-red-600 hover:bg-red-50 transition-all duration-200"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected ({selectedMaps.size})
                </Button>
              )}
              <Button
                onClick={() => router.push('/interview')}
                className="bg-sky-600 hover:bg-sky-700 text-white transition-all duration-200 shadow-sm"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Create New
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Left Panel - MECE Maps List */}
          <div className="w-1/3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center">
                    <Layers className="h-4 w-4 text-sky-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Analysis List</h2>
                    <p className="text-sm text-gray-600">
                      {maps.length} analyses
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="divide-y divide-gray-100">
                {maps.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Layers className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No MECE Analysis History
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Create MECE analysis from the chat screen
                    </p>
                    <Button
                      onClick={() => router.push('/interview')}
                      className="bg-sky-600 hover:bg-sky-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Analysis
                    </Button>
                  </div>
                ) : (
                  maps.map((map) => (
                    <div
                      key={map.id}
                      className={`p-4 cursor-pointer transition-all duration-200 ${
                        selectedMap?.id === map.id
                          ? 'bg-sky-50 border-r-2 border-sky-500'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedMap(map)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <input
                            type="checkbox"
                            checked={selectedMaps.has(map.id)}
                            onChange={(e) => {
                              e.stopPropagation()
                              toggleMapSelection(map.id)
                            }}
                            className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-gray-900 truncate leading-tight">
                              {map.theme}
                            </h3>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(map.created_at)}
                              </div>
                              <div className="flex items-center gap-1">
                                <CheckSquare className="h-3 w-3" />
                                {getCategoryCount(map.structure.categories)} items
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - MECE Map Details */}
          <div className="flex-1">
            {selectedMap ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-1">
                        {selectedMap.theme}
                      </h2>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(selectedMap.created_at)}
                        </div>
                        {selectedMap.updated_at !== selectedMap.created_at && (
                          <div className="flex items-center gap-1">
                            <span>•</span>
                            Updated: {formatDate(selectedMap.updated_at)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-sky-50 border border-sky-200 rounded-full">
                      <div className="w-2 h-2 bg-sky-500 rounded-full"></div>
                      <span className="text-xs font-medium text-sky-700">
                        {getCategoryCount(selectedMap.structure.categories)} Categories
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-4">
                    {selectedMap.structure.categories.map((category, index) => (
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
                            {category.children.length > 0 && (
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                {category.children.length} subcategories
                              </span>
                            )}
                          </div>
                        </CardHeader>

                        {expandedCategories.has(category.id) && (
                          <CardContent className="pt-0">
                            <div className="space-y-4">
                              {category.description && (
                                <div className="p-3 bg-gray-50 rounded-lg">
                                  <p className="text-sm text-gray-700 leading-relaxed">
                                    {category.description}
                                  </p>
                                </div>
                              )}

                              {/* Countermeasures Section */}
                              <div className="border-t pt-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="w-1 h-1 bg-sky-400 rounded-full"></div>
                                  <h5 className="text-sm font-medium text-gray-700">Countermeasures</h5>
                                </div>

                                {/* User Countermeasures */}
                                {category.countermeasures?.user && (
                                  <div className="mb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-sm font-medium text-gray-700">💭 My Countermeasures</span>
                                    </div>
                                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                      <p className="text-sm text-gray-700 leading-relaxed">
                                        {category.countermeasures.user}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {/* AI Countermeasures */}
                                {category.countermeasures?.ai && category.countermeasures.ai.length > 0 && (
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
                                )}

                                {/* No Countermeasures Message */}
                                {(!category.countermeasures?.user && (!category.countermeasures?.ai || category.countermeasures.ai.length === 0)) && (
                                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                                    <p className="text-sm text-gray-500">
                                      No countermeasures added yet. Click "Edit" to add countermeasures.
                                    </p>
                                  </div>
                                )}
                              </div>

                              {category.children.length > 0 && (
                                <div>
                                  <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                    <div className="w-1 h-1 bg-sky-400 rounded-full"></div>
                                    Subcategories
                                  </h5>
                                  <div className="space-y-2">
                                    {category.children.map((child, childIndex) => (
                                      <div key={child.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                        <div className="w-5 h-5 bg-sky-200 rounded-full flex items-center justify-center">
                                          <span className="text-xs font-medium text-sky-700">
                                            {index + 1}.{childIndex + 1}
                                          </span>
                                        </div>
                                        <span className="text-sm text-gray-700 font-medium">
                                          {child.name}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
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
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Brain className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select MECE Analysis
                </h3>
                <p className="text-gray-600 mb-4">
                  Select an analysis from the left list to view details
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-sky-400 rounded-full"></div>
                  <span>View structured thinking process</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 