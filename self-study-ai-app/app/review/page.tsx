'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, MessageSquare, ThumbsUp, ThumbsDown, Loader2, Trash2 } from 'lucide-react'

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
  const supabase = createClient()

  useEffect(() => {
    loadSessions()
  }, [])

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
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading sessions:', error)
        return
      }

      console.log('Sessions loaded:', data)
      setSessions(data || [])
    } catch (error) {
      console.error('Error loading sessions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMessages = async (sessionId: string) => {
    try {
      console.log('Loading messages for session:', sessionId)
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', sessionId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error loading messages:', error)
        return
      }

      console.log('Messages loaded:', data)
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

      if (error) {
        console.error('Error loading reviews:', error)
        return
      }

      setReviews(data || [])
    } catch (error) {
      console.error('Error loading reviews:', error)
    }
  }

  const generateReview = async () => {
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
        }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('Review generation error:', errorData)
        throw new Error('レビューの生成に失敗しました')
      }

      const data = await response.json()
      console.log('Review generated:', data)
      
      // Reload reviews to show the new one
      await loadReviews()
      
      alert('レビューが正常に生成されました！')
    } catch (error) {
      console.error('Error generating review:', error)
      alert('レビューの生成に失敗しました: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsGeneratingReview(false)
    }
  }

  const deleteReview = async (reviewId: string) => {
    if (!confirm('このレビューを削除しますか？この操作は取り消せません。')) {
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
        throw new Error('レビューの削除に失敗しました')
      }

      // Remove from local state
      setReviews(prev => prev.filter(review => review.id !== reviewId))
      alert('レビューを削除しました')
    } catch (error) {
      console.error('Error deleting review:', error)
      alert('レビューの削除に失敗しました: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setDeletingReviewId(null)
    }
  }

  const deleteSession = async (sessionId: string) => {
    if (!confirm('この学習セッションを削除しますか？セッションに関連する全てのメッセージとレビューも削除されます。この操作は取り消せません。')) {
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
        throw new Error('レビューの削除に失敗しました')
      }

      // Delete related messages
      const { error: messageError } = await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', sessionId)

      if (messageError) {
        console.error('Error deleting messages:', messageError)
        throw new Error('メッセージの削除に失敗しました')
      }

      // Delete the session
      const { error: sessionError } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId)

      if (sessionError) {
        console.error('Error deleting session:', sessionError)
        throw new Error('セッションの削除に失敗しました')
      }

      // Update local state
      setSessions(prev => prev.filter(session => session.id !== sessionId))
      
      // If the deleted session was selected, clear the selection
      if (selectedSession?.id === sessionId) {
        setSelectedSession(null)
        setMessages([])
        setReviews([])
      }

      alert('学習セッションを削除しました')
    } catch (error) {
      console.error('Error deleting session:', error)
      alert('セッションの削除に失敗しました: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setDeletingSessionId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            学習レビュー
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            過去の学習セッションを振り返り、AIが生成したレビューで理解度を確認しましょう
          </p>
          <div className="flex justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span>{sessions.length} セッション</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span>{reviews.length} レビュー</span>
            </div>
          </div>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Sessions List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                学習セッション
              </CardTitle>
              <CardDescription>
                過去の学習セッションを選択して復習できます
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">読み込み中...</p>
              ) : (
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <div key={session.id} className="relative group">
                      <Button
                        variant={selectedSession?.id === session.id ? 'default' : 'outline'}
                        className="w-full justify-start text-left pr-12"
                        onClick={async () => {
                          console.log('Session selected:', session)
                          setSelectedSession(session)
                          await loadMessages(session.id)
                          await loadReviews()
                        }}
                      >
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{session.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(session.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteSession(session.id)
                        }}
                        disabled={deletingSessionId === session.id}
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-800 hover:bg-red-50"
                        title="セッションを削除"
                      >
                        {deletingSessionId === session.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Messages and Reviews */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                会話履歴とレビュー
              </CardTitle>
              <CardDescription>
                {selectedSession ? selectedSession.title : 'セッションを選択してください'}
              </CardDescription>
              {selectedSession && (
                <div className="flex gap-2">
                  {reviews.length < 3 && (
                    <Button
                      onClick={generateReview}
                      disabled={isGeneratingReview}
                      className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 text-blue-700 hover:from-blue-100 hover:to-purple-100"
                    >
                      {isGeneratingReview ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          レビュー生成中...
                        </>
                      ) : (
                        <>
                          <BookOpen className="h-4 w-4 mr-2" />
                          AIレビューを生成
                        </>
                      )}
                    </Button>
                  )}
                  {reviews.length >= 3 && (
                    <Button
                      onClick={generateReview}
                      disabled={isGeneratingReview}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      {isGeneratingReview ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          生成中...
                        </>
                      ) : (
                        <>
                          <BookOpen className="h-3 w-3 mr-1" />
                          追加レビュー生成
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent>
              {selectedSession ? (
                <div className="space-y-6">
                  {/* Reviews Section */}
                  {reviews.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">生成されたレビュー ({reviews.length})</h3>
                        {reviews.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowAllReviews(!showAllReviews)}
                            className="text-xs"
                          >
                            {showAllReviews ? '最新のレビューのみ表示' : '全てのレビューを表示'}
                          </Button>
                        )}
                      </div>
                      
                      {(showAllReviews ? reviews : reviews.slice(0, 1)).map((review, index) => (
                        <Card key={review.id} className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">{review.title}</CardTitle>
                              <div className="flex items-center gap-2">
                                <div className="text-xs text-gray-500">
                                  {new Date(review.created_at).toLocaleString('ja-JP')}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteReview(review.id)}
                                  disabled={deletingReviewId === review.id}
                                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                  title="レビューを削除"
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
                          </CardHeader>
                          <CardContent>
                            <div className="whitespace-pre-wrap text-sm leading-relaxed bg-white p-4 rounded-lg border">
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
                            className="text-blue-600 hover:text-blue-800"
                          >
                            他 {reviews.length - 1} 件のレビューを表示
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Messages Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">会話履歴</h3>
                    <div className="max-h-96 overflow-y-auto space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground">
                  左側からセッションを選択してください
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 