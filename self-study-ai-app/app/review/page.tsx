'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, MessageSquare, ThumbsUp, ThumbsDown, Loader2, Trash2, ArrowLeft, ChevronDown, Brain, Bot, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import AICoachModal from '@/components/ai-coach-modal'
import BookBuilderModal from '@/components/book-builder-modal'
import ThinkingImageModal from '@/components/thinking-image-modal'

interface Session {
  id: string
  user_id: string
  file_id: string
  title: string
  created_at: string
  status: string
}



interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  audio_url: string | null
  created_at: string
}

interface Review {
  id: string
  title: string
  content: string
  summary: string
  ai_generated: boolean
  conversation_id: string
  file_id: string
  user_id: string
  created_at: string
}

export default function ReviewPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingReview, setIsGeneratingReview] = useState(false)
  const [showAllReviews, setShowAllReviews] = useState(false)
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null)
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set())
  const [isDeletingSelected, setIsDeletingSelected] = useState(false)
  const [showAICoachModal, setShowAICoachModal] = useState(false)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [showBookBuilderModal, setShowBookBuilderModal] = useState(false)
  const [showThinkingImageModal, setShowThinkingImageModal] = useState(false)
  const [bookBuilderData, setBookBuilderData] = useState<any>(null)
  const [thinkingImageData, setThinkingImageData] = useState<any>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    setIsClient(true)
    loadSessions()
  }, [])

  // URLパラメータの変更を監視
  useEffect(() => {
    const handleUrlChange = () => {
      loadSessions()
      
      // URLパラメータからモーダルを開く
      if (isClient) {
        const urlParams = new URLSearchParams(window.location.search)
        const modal = urlParams.get('modal')
        
        if (modal === 'book-builder') {
          const title = urlParams.get('title') || 'New Book'
          const introduction = urlParams.get('introduction') || ''
          setBookBuilderData({
            title,
            introduction,
            chapters: []
          })
          setShowBookBuilderModal(true)
          
          // URLパラメータをクリア
          const newUrl = window.location.pathname
          window.history.pushState({}, '', newUrl)
        } else if (modal === 'thinking-image') {
          const theme = urlParams.get('theme') || 'New Theme'
          const concept = urlParams.get('concept') || ''
          setThinkingImageData({
            theme,
            concept
          })
          setShowThinkingImageModal(true)
          
          // URLパラメータをクリア
          const newUrl = window.location.pathname
          window.history.pushState({}, '', newUrl)
        }
      }
    }

    // URLの変更を監視
    window.addEventListener('popstate', handleUrlChange)
    
    // 初回読み込み時にもチェック
    handleUrlChange()
    
    return () => {
      window.removeEventListener('popstate', handleUrlChange)
    }
  }, [isClient])

  useEffect(() => {
    if (selectedSession) {
      loadMessages(selectedSession.id)
    }
  }, [selectedSession])

  useEffect(() => {
    if (messages.length > 0) {
      loadReviews()
    }
  }, [messages])

  const loadSessions = async () => {
    setIsLoading(true)
    try {
      console.log('Loading sessions...')
      
      // URLパラメータからfile_idを取得（クライアントサイドのみ）
      let fileId: string | null = null
      if (isClient) {
        const urlParams = new URLSearchParams(window.location.search)
        fileId = urlParams.get('file_id')
      }
      
      let query = supabase
        .from('sessions')
        .select('*')
        .order('created_at', { ascending: false })

      // file_idが指定されている場合は、そのファイルのセッションのみを取得
      if (fileId) {
        query = query.eq('file_id', fileId)
        console.log('Filtering sessions by file_id:', fileId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error loading sessions:', error)
        // エラーの詳細をログに出力
        if (error.message) {
          console.error('Error message:', error.message)
        }
        if (error.details) {
          console.error('Error details:', error.details)
        }
        return
      }

      // 空のセッション（file_idがnullまたは空）をフィルタリング
      const validSessions = data?.filter(session => session.file_id && session.file_id.trim() !== '') || []
      
      // さらに、メッセージが存在するセッションのみを表示するフィルタリングを追加
      const sessionsWithMessages = []
      for (const session of validSessions) {
        const { data: messages } = await supabase
          .from('messages')
          .select('id')
          .eq('conversation_id', session.id)
          .limit(1)
        
        if (messages && messages.length > 0) {
          sessionsWithMessages.push(session)
        }
      }
      

      setSessions(sessionsWithMessages)
      
      // セッションが1つしかない場合は自動選択
      if (sessionsWithMessages.length === 1) {
        setSelectedSession(sessionsWithMessages[0])
      }
    } catch (error) {
      console.error('Error loading sessions:', error)
    } finally {
      setIsLoading(false)
    }
  }



  const loadMessages = async (sessionId: string) => {
    try {

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', sessionId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error loading messages:', error)
        return
      }


      setMessages(data || [])
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const loadReviews = async () => {
    if (!selectedSession) return

    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('conversation_id', selectedSession?.id)
        .is('user_id', null) // Only load reviews without authentication

      if (error) {
        console.error('Error loading reviews:', error)
        return
      }

      setReviews(data || [])
    } catch (error) {
      console.error('Error loading reviews:', error)
    }
  }

  const generateReview = async (reviewType: 'normal' | 'conversation' | 'learning' = 'normal') => {
    if (!selectedSession) return

    setIsGeneratingReview(true)
    try {
      // Get file information for context
      const { data: file } = await supabase
        .from('uploaded_files')
        .select('extracted_text')
        .eq('id', selectedSession.file_id)
        .single()

      const response = await fetch('/api/generate-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: selectedSession.id,
          fileId: selectedSession.file_id,
          extractedText: file?.extracted_text || '',
          reviewType: reviewType,
        }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('Review generation error:', errorData)
        throw new Error('Failed to generate review')
      }

      const data = await response.json()
      console.log('Review generated:', data)
      
      // Reload reviews to show the new one
      await loadReviews()
      
      alert('Review generated successfully!')
    } catch (error) {
      console.error('Error generating review:', error)
      alert('Failed to generate review: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsGeneratingReview(false)
    }
  }

  const deleteReview = async (reviewId: string) => {
    if (!confirm('Delete this review? This action cannot be undone.')) {
      return
    }

    setDeletingReviewId(reviewId)
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)

      if (error) {
        console.error('Error deleting review:', error)
        throw new Error('Failed to delete review')
      }

      // Remove from local state
      setReviews(prev => prev.filter(review => review.id !== reviewId))
      alert('Review deleted')
    } catch (error) {
      console.error('Error deleting review:', error)
      alert('Failed to delete review: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setDeletingReviewId(null)
    }
  }

  const deleteSession = async (sessionId: string) => {
    if (!confirm('Delete this learning session? All related messages and reviews will also be deleted. This action cannot be undone.')) {
      return
    }

    setDeletingSessionId(sessionId)
    try {
      // Delete related reviews first
      const { error: reviewError } = await supabase
        .from('reviews')
        .delete()
        .eq('conversation_id', sessionId)

      if (reviewError) {
        console.error('Error deleting reviews:', reviewError)
        throw new Error('Failed to delete reviews')
      }

      // Delete related messages
      const { error: messageError } = await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', sessionId)

      if (messageError) {
        console.error('Error deleting messages:', messageError)
        throw new Error('Failed to delete messages')
      }

      // Delete the session
      const { error: sessionError } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId)

      if (sessionError) {
        console.error('Error deleting session:', sessionError)
        throw new Error('Failed to delete session')
      }

      // Update local state
      setSessions(prev => prev.filter(session => session.id !== sessionId))
      
      // If the deleted session was selected, clear the selection
      if (selectedSession?.id === sessionId) {
        setSelectedSession(null)
        setMessages([])
        setReviews([])
      }

      alert('Learning session deleted')
    } catch (error) {
      console.error('Error deleting session:', error)
      alert('Failed to delete session: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setDeletingSessionId(null)
    }
  }

  const toggleSessionSelection = (sessionId: string) => {
    setSelectedSessions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId)
      } else {
        newSet.add(sessionId)
      }
      return newSet
    })
  }

  const deleteSelectedSessions = async () => {
    if (selectedSessions.size === 0) return

    if (!confirm(`Delete ${selectedSessions.size} selected session(s)? All related messages and reviews will also be deleted. This action cannot be undone.`)) {
      return
    }

    setIsDeletingSelected(true)
    try {
      const sessionIds = Array.from(selectedSessions)
      
      for (const sessionId of sessionIds) {
        // Delete related reviews first
        const { error: reviewError } = await supabase
          .from('reviews')
          .delete()
          .eq('conversation_id', sessionId)

        if (reviewError) {
          console.error('Error deleting reviews:', reviewError)
          throw new Error('Failed to delete reviews')
        }

        // Delete related messages
        const { error: messageError } = await supabase
          .from('messages')
          .delete()
          .eq('conversation_id', sessionId)

        if (messageError) {
          console.error('Error deleting messages:', messageError)
          throw new Error('Failed to delete messages')
        }

        // Delete the session
        const { error: sessionError } = await supabase
          .from('sessions')
          .delete()
          .eq('id', sessionId)

        if (sessionError) {
          console.error('Error deleting session:', sessionError)
          throw new Error('Failed to delete session')
        }
      }

      // Update local state
      setSessions(prev => prev.filter(session => !selectedSessions.has(session.id)))
      
      // Clear selection if deleted session was selected
      if (selectedSession && selectedSessions.has(selectedSession.id)) {
        setSelectedSession(null)
        setMessages([])
        setReviews([])
      }

      setSelectedSessions(new Set())
      alert(`${sessionIds.length} session(s) deleted successfully`)
    } catch (error) {
      console.error('Error deleting selected sessions:', error)
      alert('Failed to delete selected sessions: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsDeletingSelected(false)
    }
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
              className="bg-white border border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400 shadow-sm transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-sky-600">Learning Review</h1>
              <p className="text-gray-600 mt-2">Review past learning sessions and verify understanding with AI-generated reviews</p>
            </div>
          </div>
        </div>

        {/* Preview Mode Banner */}
        {isClient && (() => {
          const urlParams = new URLSearchParams(window.location.search)
          const fileId = urlParams.get('file_id')
          
          return fileId ? (
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-sky-700 font-medium">
                    Preview Mode: Showing sessions for specific file only
                  </p>
                  <p className="text-xs text-sky-600 mt-1">
                    {sessions.length} sessions displayed
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (isClient) {
                        const newUrl = window.location.pathname
                        window.history.pushState({}, '', newUrl)
                        window.location.reload()
                      }
                    }}
                    className="bg-white border border-sky-300 text-sky-700 hover:bg-sky-50 hover:border-sky-400 shadow-sm transition-all duration-200"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Return to Normal Mode
                  </Button>
                </div>
              </div>
            </div>
          ) : null
        })()}

        {/* Content */}
        {sessions.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <BookOpen className="h-10 w-10 text-sky-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Learning Sessions Found
            </h3>
            <p className="text-gray-600 mb-6">
              Start a learning session on the Interview page to see reviews here
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
                  onClick={loadSessions}
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
            {/* Left Sidebar - Sessions List */}
            <div className="lg:col-span-1">
              <Card className="shadow-lg border-0 h-[calc(100vh-200px)] flex flex-col">
                <CardHeader className="flex-shrink-0 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">📚 Sessions</div>
                      <CardTitle className="text-lg text-gray-900">Sessions</CardTitle>
                      <CardDescription>
                        {sessions.length} sessions
                      </CardDescription>
                    </div>
                    {selectedSessions.size > 0 && (
                      <Button
                        onClick={deleteSelectedSessions}
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
                            Delete Selected ({selectedSessions.size})
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-y-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="h-6 w-6 animate-spin text-sky-600" />
                    </div>
                  ) : (
                    <div className="py-2">
                      {sessions.map((session) => (
                        <div
                          key={session.id}
                          className="group relative"
                        >
                          <div
                            className={`p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
                              selectedSession?.id === session.id ? 'bg-sky-50 border-l-4 border-l-sky-500' : ''
                            } ${selectedSessions.has(session.id) ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                          >
                            <div className="flex items-start justify-between">
                              <div 
                                className="flex-1 min-w-0"
                                onClick={async () => {
                                  setSelectedSession(session)
                                  await loadMessages(session.id)
                                  await loadReviews()
                                }}
                              >
                                <h3 className="text-sm font-medium text-gray-900 truncate">
                                  {session.title}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">
                                  {formatDate(session.created_at)}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <MessageSquare className="h-3 w-3 text-sky-600" />
                                  <span className="text-xs text-gray-600">
                                    {messages.length} messages
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleSessionSelection(session.id)
                                  }}
                                  className={`transition-all duration-200 rounded-lg ${
                                    selectedSessions.has(session.id)
                                      ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                      : 'opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                                  }`}
                                  title={selectedSessions.has(session.id) ? 'Deselect' : 'Select for deletion'}
                                >
                                  {selectedSessions.has(session.id) ? (
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
                                    deleteSession(session.id)
                                  }}
                                  disabled={deletingSessionId === session.id}
                                  className="opacity-0 group-hover:opacity-100 transition-all duration-200 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                  title="Delete session"
                                >
                                  {deletingSessionId === session.id ? (
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
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Side - Session Details */}
            <div className="lg:col-span-2">
              {selectedSession ? (
                <Card className="shadow-lg border-0 h-[calc(100vh-200px)] flex flex-col">
                  <CardHeader className="flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl text-gray-900">
                          {selectedSession.title}
                        </CardTitle>
                        <CardDescription className="text-gray-600 mt-1">
                          {formatDate(selectedSession.created_at)}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-sky-600" />
                        <span className="text-sm text-gray-600">
                          {messages.length} messages
                        </span>
                      </div>
                    </div>

                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto">
                    <div className="space-y-6">
                      {/* Reviews Section */}
                      {reviews.length > 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">Generated Reviews ({reviews.length})</h3>
                            {reviews.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowAllReviews(!showAllReviews)}
                                className="text-xs"
                              >
                                {showAllReviews ? 'Show Latest Only' : 'Show All Reviews'}
                              </Button>
                            )}
                          </div>
                          
                          {(showAllReviews ? reviews : reviews.slice(0, 1)).map((review, index) => (
                            <Card key={review.id} className="bg-white shadow-sm border border-gray-200 rounded-lg">
                              <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-lg text-gray-900">{review.title}</CardTitle>
                                  <div className="flex items-center gap-2">
                                    <div className="text-xs text-gray-500">
                                      {formatDate(review.created_at)}
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => deleteReview(review.id)}
                                      disabled={deletingReviewId === review.id}
                                      className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                                      title="Delete review"
                                    >
                                      {deletingReviewId === review.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                </div>
                                {review.summary && (
                                  <CardDescription className="text-sm font-medium text-gray-700">
                                    {review.summary}
                                  </CardDescription>
                                )}
                                <div className="flex gap-2 mt-4">
                                  <Button
                                    onClick={() => {
                                      setSelectedReview(review);
                                      setShowAICoachModal(true);
                                    }}
                                    className="bg-sky-500 hover:bg-sky-600 text-white"
                                    size="sm"
                                  >
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Reflecta Coach
                                  </Button>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="whitespace-pre-wrap text-sm leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100 text-gray-800">
                                  {review.content}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                          
                          {!showAllReviews && reviews.length > 1 && (
                            <div className="text-center py-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowAllReviews(true)}
                                className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                              >
                                Show {reviews.length - 1} more reviews
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Messages Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Conversation History</h3>
                        <div className="max-h-96 overflow-y-auto space-y-4">
                          {messages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-xl ${
                                  message.role === 'user'
                                    ? 'bg-sky-100 text-gray-900 shadow-sm'
                                    : 'bg-white border border-gray-200 text-gray-900 shadow-sm'
                                }`}
                              >
                                <p className="text-sm">{message.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow-lg border-0 h-[calc(100vh-200px)] flex flex-col">
                  <CardContent className="p-8 flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Select a Session
                      </h3>
                      <p className="text-gray-600">
                        Choose a session from the left list to view details
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* AI Coach Modal */}
      {showAICoachModal && selectedReview && (
        <AICoachModal
          isOpen={showAICoachModal}
          onClose={() => {
            setShowAICoachModal(false);
            setSelectedReview(null);
          }}
          reviewContent={selectedReview.content}
          reviewId={selectedReview.id}
        />
      )}

      {/* Book Builder Modal */}
      {showBookBuilderModal && bookBuilderData && (
        <BookBuilderModal
          isOpen={showBookBuilderModal}
          onClose={() => {
            setShowBookBuilderModal(false);
            setBookBuilderData(null);
          }}
          initialData={bookBuilderData}
        />
      )}

      {/* Thinking Image Modal */}
      {showThinkingImageModal && thinkingImageData && (
        <ThinkingImageModal
          isOpen={showThinkingImageModal}
          onClose={() => {
            setShowThinkingImageModal(false);
            setThinkingImageData(null);
          }}
          initialData={thinkingImageData}
        />
      )}
    </div>
  )
} 