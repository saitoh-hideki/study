'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react'

interface Session {
  id: string
  user_id: string
  file_id: string
  title: string
  started_at: string
  ended_at: string | null
}

interface Message {
  id: string
  session_id: string
  role: 'user' | 'assistant'
  message: string
  audio_url: string | null
  created_at: string
}

interface Review {
  id: string
  message_id: string
  understood: boolean
  note: string | null
  created_at: string
}

export default function ReviewPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadSessions()
  }, [])

  useEffect(() => {
    if (selectedSession) {
      loadMessages(selectedSession.id)
      loadReviews(selectedSession.id)
    }
  }, [selectedSession])

  const loadSessions = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .order('started_at', { ascending: false })

      if (error) {
        console.error('Error loading sessions:', error)
        return
      }

      setSessions(data || [])
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
        .eq('session_id', sessionId)
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

  const loadReviews = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .in('message_id', messages.map(m => m.id))

      if (error) {
        console.error('Error loading reviews:', error)
        return
      }

      setReviews(data || [])
    } catch (error) {
      console.error('Error loading reviews:', error)
    }
  }

  const addReview = async (messageId: string, understood: boolean, note?: string) => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          message_id: messageId,
          understood,
          note: note || null,
        })
        .select()
        .single()

      if (error) {
        console.error('Error adding review:', error)
        return
      }

      setReviews(prev => [...prev, data])
    } catch (error) {
      console.error('Error adding review:', error)
    }
  }

  const getReviewForMessage = (messageId: string) => {
    return reviews.find(review => review.message_id === messageId)
  }

  return (
    <div className="container max-w-6xl mx-auto p-4 space-y-6">
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
                  <Button
                    key={session.id}
                    variant={selectedSession?.id === session.id ? 'default' : 'outline'}
                    className="w-full justify-start text-left"
                    onClick={() => setSelectedSession(session)}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{session.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(session.started_at).toLocaleDateString()}
                      </span>
                    </div>
                  </Button>
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
          </CardHeader>
          <CardContent>
            {selectedSession ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {messages.map((message) => {
                  const review = getReviewForMessage(message.id)
                  return (
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
                        <p className="text-sm">{message.message}</p>
                        {message.role === 'assistant' && (
                          <div className="mt-2 flex gap-2">
                            {review ? (
                              <div className="flex items-center gap-1 text-xs">
                                {review.understood ? (
                                  <ThumbsUp className="h-3 w-3 text-green-500" />
                                ) : (
                                  <ThumbsDown className="h-3 w-3 text-red-500" />
                                )}
                                <span className="text-muted-foreground">
                                  {review.understood ? '理解した' : '理解できなかった'}
                                </span>
                              </div>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => addReview(message.id, true)}
                                  className="h-6 px-2"
                                >
                                  <ThumbsUp className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => addReview(message.id, false)}
                                  className="h-6 px-2"
                                >
                                  <ThumbsDown className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
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
  )
} 