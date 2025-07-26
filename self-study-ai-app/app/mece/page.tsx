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
  Sparkles,
  ArrowLeft,
  Loader2
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
  const [deletingMapId, setDeletingMapId] = useState<string | null>(null)
  const [isDeletingSelected, setIsDeletingSelected] = useState(false)
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

  const deleteMap = async (mapId: string) => {
    if (!confirm('Delete this MECE analysis? This action cannot be undone.')) {
      return
    }

    setDeletingMapId(mapId)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const userId = user?.id || null

      let query = supabase
        .from('mece_maps')
        .delete()
        .eq('id', mapId)

      if (userId) {
        query = query.eq('user_id', userId)
      } else {
        query = query.is('user_id', null)
      }

      const { error } = await query

      if (error) {
        console.error('Error deleting map:', error)
        alert('Failed to delete analysis')
      } else {
        setMaps(prev => prev.filter(map => map.id !== mapId))
        if (selectedMap?.id === mapId) {
          setSelectedMap(null)
        }
      }
    } catch (error) {
      console.error('Error deleting map:', error)
      alert('Failed to delete analysis')
    } finally {
      setDeletingMapId(null)
    }
  }

  const deleteSelectedMaps = async () => {
    if (selectedMaps.size === 0) return

    if (!confirm(`Delete ${selectedMaps.size} selected MECE analysis? This action cannot be undone.`)) {
      return
    }

    setIsDeletingSelected(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const userId = user?.id || null

      const mapIds = Array.from(selectedMaps)
      let query = supabase
        .from('mece_maps')
        .delete()
        .in('id', mapIds)

      if (userId) {
        query = query.eq('user_id', userId)
      } else {
        query = query.is('user_id', null)
      }

      const { error } = await query

      if (error) {
        console.error('Error deleting selected maps:', error)
        alert('Failed to delete selected analyses')
      } else {
        setMaps(prev => prev.filter(map => !selectedMaps.has(map.id)))
        setSelectedMaps(new Set())
        if (selectedMap && selectedMaps.has(selectedMap.id)) {
          setSelectedMap(null)
        }
      }
    } catch (error) {
      console.error('Error deleting selected maps:', error)
      alert('Failed to delete selected analyses')
    } finally {
      setIsDeletingSelected(false)
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
    return new Date(dateString).toLocaleDateString('ja-JP', {
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="container max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white pt-20">
      <div className="container max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/interview')}
              className="bg-white border border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400 shadow-sm transition-all"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-sky-600">MECE Analysis History</h1>
              <p className="text-gray-600 mt-2">Structured thinking process for comprehensive analysis</p>
            </div>
          </div>
        </div>

        {/* Content */}
        {maps.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Brain className="h-10 w-10 text-sky-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No MECE Analysis Found
            </h3>
            <p className="text-gray-600 mb-6">
              Create a MECE analysis on the Interview page
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => router.push('/interview')}
                className="bg-sky-600 hover:bg-sky-700"
              >
                Back to Interview
              </Button>
              <div>
                <Button
                  onClick={loadMECEMaps}
                  variant="outline"
                  className="mt-2"
                >
                  Reload
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Sidebar - Analysis List */}
            <div className="lg:col-span-1">
              <Card className="shadow-lg border-0 h-[calc(100vh-200px)] flex flex-col">
                <CardHeader className="flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg text-gray-900">Analysis List</CardTitle>
                      <CardDescription>
                        {maps.length} analyses
                      </CardDescription>
                    </div>
                    {selectedMaps.size > 0 && (
                      <Button
                        onClick={deleteSelectedMaps}
                        disabled={isDeletingSelected}
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white transition-all duration-200"
                      >
                        {isDeletingSelected ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete Selected ({selectedMaps.size})
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-y-auto">
                  <div>
                    {maps.map((map) => (
                      <div
                        key={map.id}
                        className="group relative"
                      >
                        <div
                          className={`p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
                            selectedMap?.id === map.id ? 'bg-sky-50 border-l-4 border-l-sky-500' : ''
                          } ${selectedMaps.has(map.id) ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                        >
                          <div className="flex items-start justify-between">
                            <div 
                              className="flex-1 min-w-0"
                              onClick={() => setSelectedMap(map)}
                            >
                              <h3 className="text-sm font-medium text-gray-900 truncate">
                                {map.theme}
                              </h3>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDate(map.created_at)}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Brain className="h-3 w-3 text-sky-600" />
                                <span className="text-xs text-gray-600">
                                  {getCategoryCount(map.structure.categories)} categories
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleMapSelection(map.id)
                                }}
                                className={`transition-all duration-200 rounded-lg ${
                                  selectedMaps.has(map.id)
                                    ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                    : 'opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                                }`}
                                title={selectedMaps.has(map.id) ? 'Deselect' : 'Select for deletion'}
                              >
                                {selectedMaps.has(map.id) ? (
                                  <div className="w-3 h-3 bg-blue-600 rounded-sm"></div>
                                ) : (
                                  <div className="w-3 h-3 border border-gray-400 rounded-sm"></div>
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteMap(map.id)
                                }}
                                disabled={deletingMapId === map.id}
                                className="opacity-0 group-hover:opacity-100 transition-all duration-200 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                title="Delete analysis"
                              >
                                {deletingMapId === map.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Side - Original MECE Details */}
            <div className="lg:col-span-2">
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
        )}
      </div>
    </div>
  )
} 