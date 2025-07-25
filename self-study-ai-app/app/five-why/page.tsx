'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, HelpCircle, Brain, Loader2, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface FiveWhyLevel {
  id: string
  level_number: number
  question: string
  answer: string
  created_at: string
}

interface FiveWhyTree {
  id: string
  topic: string
  root_cause: string | null
  insights: any
  created_at: string
  five_why_levels: FiveWhyLevel[]
}

export default function FiveWhyPage() {
  const [trees, setTrees] = useState<FiveWhyTree[]>([])
  const [selectedTree, setSelectedTree] = useState<FiveWhyTree | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [deletingTreeId, setDeletingTreeId] = useState<string | null>(null)
  const [selectedTrees, setSelectedTrees] = useState<Set<string>>(new Set())
  const [isDeletingSelected, setIsDeletingSelected] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadFiveWhyTrees()
  }, [])

  const loadFiveWhyTrees = async () => {
    try {
      setIsLoading(true)
      
      // 匿名ユーザーの場合はuser_idがnullのデータを取得
      const { data: { user } } = await supabase.auth.getUser()
      
      const userId = user?.id || null
      console.log('Loading trees for user:', userId)

      let query = supabase
        .from('five_why_trees')
        .select(`
          *,
          five_why_levels (*)
        `)
        .order('created_at', { ascending: false })

      // user_idがnullの場合はis.nullを使用
      if (userId === null) {
        query = query.is('user_id', null)
      } else {
        query = query.eq('user_id', userId)
      }

      const { data, error } = await query

      console.log('Query result:', { data, error, userId })

      if (error) {
        console.error('Error loading five why trees:', error)
        setTrees([])
        return
      }

      setTrees(data || [])
      
      // 最初の分析を選択
      if (data && data.length > 0 && !selectedTree) {
        setSelectedTree(data[0])
      }
    } catch (error) {
      console.error('Error loading five why trees:', error)
      setTrees([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    router.push('/interview')
  }

  const deleteTree = async (treeId: string) => {
    if (!confirm('Delete this 5 Whys analysis? This action cannot be undone.')) {
      return
    }

    setDeletingTreeId(treeId)
    try {
      // Delete related levels first
      const { error: levelsError } = await supabase
        .from('five_why_levels')
        .delete()
        .eq('five_why_tree_id', treeId)

      if (levelsError) {
        console.error('Error deleting levels:', levelsError)
        throw new Error('Failed to delete analysis levels')
      }

      // Delete the tree
      const { error: treeError } = await supabase
        .from('five_why_trees')
        .delete()
        .eq('id', treeId)

      if (treeError) {
        console.error('Error deleting tree:', treeError)
        throw new Error('Failed to delete analysis')
      }

      // Update local state
      setTrees(prev => prev.filter(tree => tree.id !== treeId))
      
      // If the deleted tree was selected, clear the selection
      if (selectedTree?.id === treeId) {
        setSelectedTree(null)
      }

      alert('5 Whys analysis deleted')
    } catch (error) {
      console.error('Error deleting tree:', error)
      alert('Failed to delete analysis: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setDeletingTreeId(null)
    }
  }

  const toggleTreeSelection = (treeId: string) => {
    setSelectedTrees(prev => {
      const newSet = new Set(prev)
      if (newSet.has(treeId)) {
        newSet.delete(treeId)
      } else {
        newSet.add(treeId)
      }
      return newSet
    })
  }

  const deleteSelectedTrees = async () => {
    if (selectedTrees.size === 0) return

    if (!confirm(`Delete ${selectedTrees.size} selected analysis(ies)? This action cannot be undone.`)) {
      return
    }

    setIsDeletingSelected(true)
    try {
      const treeIds = Array.from(selectedTrees)
      
      for (const treeId of treeIds) {
        // Delete related levels first
        const { error: levelsError } = await supabase
          .from('five_why_levels')
          .delete()
          .eq('five_why_tree_id', treeId)

        if (levelsError) {
          console.error('Error deleting levels:', levelsError)
          throw new Error('Failed to delete analysis levels')
        }

        // Delete the tree
        const { error: treeError } = await supabase
          .from('five_why_trees')
          .delete()
          .eq('id', treeId)

        if (treeError) {
          console.error('Error deleting tree:', treeError)
          throw new Error('Failed to delete analysis')
        }
      }

      // Update local state
      setTrees(prev => prev.filter(tree => !selectedTrees.has(tree.id)))
      
      // Clear selection if deleted tree was selected
      if (selectedTree && selectedTrees.has(selectedTree.id)) {
        setSelectedTree(null)
      }

      setSelectedTrees(new Set())
      alert(`${treeIds.length} analysis(ies) deleted successfully`)
    } catch (error) {
      console.error('Error deleting selected trees:', error)
      alert('Failed to delete selected analyses: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsDeletingSelected(false)
    }
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
              onClick={handleBack}
              className="bg-white border border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400 shadow-sm transition-all"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">5 Whys Analysis History</h1>
              <p className="text-gray-600 mt-2">Deep-dive analysis results for root cause identification</p>
            </div>
          </div>
        </div>

        {/* Content */}
        {trees.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <HelpCircle className="h-10 w-10 text-sky-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No 5 Whys Analysis Found
            </h3>
            <p className="text-gray-600 mb-6">
              Create a 5 Whys analysis on the Interview page
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
                  onClick={loadFiveWhyTrees}
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
                        {trees.length} analyses
                      </CardDescription>
                    </div>
                    {selectedTrees.size > 0 && (
                      <Button
                        onClick={deleteSelectedTrees}
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
                            Delete Selected ({selectedTrees.size})
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-y-auto">
                  <div>
                    {trees.map((tree) => (
                      <div
                        key={tree.id}
                        className="group relative"
                      >
                        <div
                          className={`p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
                            selectedTree?.id === tree.id ? 'bg-sky-50 border-l-4 border-l-sky-500' : ''
                          } ${selectedTrees.has(tree.id) ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                        >
                          <div className="flex items-start justify-between">
                            <div 
                              className="flex-1 min-w-0"
                              onClick={() => setSelectedTree(tree)}
                            >
                              <h3 className="text-sm font-medium text-gray-900 truncate">
                                {tree.topic}
                              </h3>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDate(tree.created_at)}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Brain className="h-3 w-3 text-sky-600" />
                                <span className="text-xs text-gray-600">
                                  {tree.five_why_levels.length} levels
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleTreeSelection(tree.id)
                                }}
                                className={`transition-all duration-200 rounded-lg ${
                                  selectedTrees.has(tree.id)
                                    ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                    : 'opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                                }`}
                                title={selectedTrees.has(tree.id) ? 'Deselect' : 'Select for deletion'}
                              >
                                {selectedTrees.has(tree.id) ? (
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
                                  deleteTree(tree.id)
                                }}
                                disabled={deletingTreeId === tree.id}
                                className="opacity-0 group-hover:opacity-100 transition-all duration-200 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                title="Delete analysis"
                              >
                                {deletingTreeId === tree.id ? (
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

            {/* Right Side - Analysis Details */}
            <div className="lg:col-span-2">
              {selectedTree ? (
                <Card className="shadow-lg border-0 h-[calc(100vh-200px)] flex flex-col">
                  <CardHeader className="flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl text-gray-900">
                          {selectedTree.topic}
                        </CardTitle>
                        <CardDescription className="text-gray-600 mt-1">
                          {formatDate(selectedTree.created_at)}
                        </CardDescription>
                      </div>
                                           <div className="flex items-center gap-2">
                       <Brain className="h-5 w-5 text-sky-600" />
                       <span className="text-sm text-gray-600">
                         {selectedTree.five_why_levels.length} levels
                       </span>
                     </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto">
                    <div className="space-y-6">
                      {/* Root Cause */}
                                           {selectedTree.root_cause && (
                       <div className="bg-sky-50 rounded-lg p-4">
                         <h4 className="text-lg font-semibold text-gray-900 mb-2">Root Cause</h4>
                         <p className="text-gray-900">{selectedTree.root_cause}</p>
                       </div>
                     )}

                     {/* Five Why Levels */}
                     <div className="space-y-4">
                       <h3 className="text-lg font-semibold text-gray-900">Analysis Results</h3>
                        {selectedTree.five_why_levels
                          .sort((a, b) => a.level_number - b.level_number)
                          .map((level) => (
                            <div key={level.id} className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-start gap-4">
                                <div className="flex-1 space-y-2">
                                                                     <div>
                                     <label className="block text-sm font-medium text-gray-700 mb-1">
                                       Question
                                     </label>
                                     <p className="text-sm text-gray-900 bg-white p-3 rounded border">
                                       {level.question}
                                     </p>
                                   </div>
                                   <div>
                                     <label className="block text-sm font-medium text-gray-700 mb-1">
                                       Answer
                                     </label>
                                     <p className="text-sm text-gray-900 bg-white p-3 rounded border">
                                       {level.answer}
                                     </p>
                                   </div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow-lg border-0 h-[calc(100vh-200px)] flex flex-col">
                  <CardContent className="p-8 flex-1 flex items-center justify-center">
                                         <div className="text-center">
                       <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                       <h3 className="text-lg font-medium text-gray-900 mb-2">
                         Select an Analysis
                       </h3>
                       <p className="text-gray-600">
                         Choose an analysis from the left list to view details
                       </p>
                     </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 