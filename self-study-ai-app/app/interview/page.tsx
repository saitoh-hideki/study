'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { Mic, Send, Play, Pause, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  audio_url: string | null
  created_at: string
}

interface Conversation {
  id: string
  user_id: string
  upload_id: string
  title: string
  status: string
  created_at: string
}

export default function InterviewPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [supabase, setSupabase] = useState<any>(null)
  const [streamingMessage, setStreamingMessage] = useState('')
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingMessage])

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
      initializeConversation()
    }
  }, [supabase])

  const initializeConversation = async () => {
    if (!supabase) return
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      // Get file ID from localStorage
      const fileId = localStorage.getItem('currentFileId')
      if (!fileId) {
        console.error('No file ID found')
        return
      }

      let currentConversation = null

      if (user) {
        // Authenticated user - check if conversation already exists for this file
        const { data: existingConversation, error: conversationError } = await supabase
          .from('conversations')
          .select('*')
          .eq('user_id', user.id)
          .eq('upload_id', fileId)
          .eq('status', 'active')
          .single()

        if (conversationError && conversationError.code !== 'PGRST116') {
          console.error('Error checking conversation:', conversationError)
          return
        }

        currentConversation = existingConversation

        // Create new conversation if none exists
        if (!existingConversation) {
          const { data: newConversation, error: createError } = await supabase
            .from('conversations')
            .insert({
              user_id: user.id,
              upload_id: fileId,
              title: 'AI Interview Session',
              status: 'active'
            })
            .select()
            .single()

          if (createError) {
            console.error('Error creating conversation:', createError)
            return
          }

          currentConversation = newConversation
        }
      } else {
        // Anonymous user - create a temporary conversation ID
        // For anonymous users, we'll use a session-based approach
        const sessionId = `anonymous-${Date.now()}`
        currentConversation = {
          id: sessionId,
          user_id: null,
          upload_id: fileId,
          title: 'AI Interview Session (Anonymous)',
          status: 'active',
          created_at: new Date().toISOString()
        }
      }

      setConversation(currentConversation)
      
      if (user) {
        // Only load messages from database for authenticated users
        loadMessages(currentConversation.id)
      } else {
        // Load messages from localStorage for anonymous users
        const savedMessages = localStorage.getItem(`messages-${currentConversation.id}`)
        if (savedMessages) {
          try {
            const messages = JSON.parse(savedMessages)
            setMessages(messages)
          } catch (error) {
            console.error('Error loading messages from localStorage:', error)
          }
        }
      }

    } catch (error) {
      console.error('Error initializing conversation:', error)
    }
  }

  const loadMessages = async (conversationId: string) => {
    if (!supabase) return
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
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

  const sendMessage = async () => {
    if (!inputMessage.trim() || !conversation) return

    console.log('sendMessage called with:', inputMessage)
    console.log('conversation:', conversation)

    setIsLoading(true)
    setStreamingMessage('')
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      console.log('Current user:', user)

      if (user && supabase) {
        console.log('Processing as authenticated user')
        // Authenticated user - save to database
        const { data: userMessage, error: userError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversation.id,
            role: 'user',
            content: inputMessage,
          })
          .select()
          .single()

        if (userError) {
          console.error('Error saving user message:', userError)
          return
        }

        // Add user message to state
        setMessages(prev => [...prev, userMessage])
        setInputMessage('')

        // Generate AI response with streaming
        console.log('Calling generateAIResponse...')
        const aiResponse = await generateAIResponse(inputMessage, setStreamingMessage)

        // Save AI message
        const { data: aiMessage, error: aiError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversation.id,
            role: 'assistant',
            content: aiResponse,
            audio_url: null, // TODO: Generate audio URL
          })
          .select()
          .single()

        if (aiError) {
          console.error('Error saving AI message:', aiError)
          return
        }

        // Add AI message to state
        setMessages(prev => [...prev, aiMessage])
      } else {
        console.log('Processing as anonymous user')
        // Anonymous user - save to localStorage
        const userMessage = {
          id: `msg-${Date.now()}-1`,
          conversation_id: conversation.id,
          role: 'user' as const,
          content: inputMessage,
          audio_url: null,
          created_at: new Date().toISOString()
        }

        // Add user message to state
        setMessages(prev => [...prev, userMessage])
        setInputMessage('')

        // Generate AI response with streaming
        console.log('Calling generateAIResponse for anonymous user...')
        const aiResponse = await generateAIResponse(inputMessage, setStreamingMessage)

        const aiMessage = {
          id: `msg-${Date.now()}-2`,
          conversation_id: conversation.id,
          role: 'assistant' as const,
          content: aiResponse,
          audio_url: null,
          created_at: new Date().toISOString()
        }

        // Add AI message to state
        setMessages(prev => [...prev, aiMessage])

        // Save messages to localStorage for anonymous users
        const allMessages = [...messages, userMessage, aiMessage]
        localStorage.setItem(`messages-${conversation.id}`, JSON.stringify(allMessages))
      }

    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsLoading(false)
      setStreamingMessage('')
    }
  }

  const generateAIResponse = async (userMessage: string, onStream?: (content: string) => void): Promise<string> => {
    try {
      console.log('generateAIResponse called with:', userMessage)
      
      // Get current file ID from localStorage
      const fileId = localStorage.getItem('currentFileId')
      console.log('fileId from localStorage:', fileId)
      console.log('conversation:', conversation)
      
      const requestBody = {
        message: userMessage,
        conversationId: conversation?.id,
        fileId: fileId,
        difficulty: 'normal', // TODO: Get from user settings
      }
      
      console.log('Sending request to API:', requestBody)
      
      const response = await fetch('/api/generate-ai-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      console.log('API response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API error response:', errorText)
        throw new Error('Failed to generate AI response')
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      let fullResponse = ''
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              break
            }

            try {
              const parsed = JSON.parse(data)
              if (parsed.content) {
                fullResponse += parsed.content
                if (onStream) {
                  onStream(fullResponse)
                }
              } else if (parsed.error) {
                console.error('Streaming error:', parsed.error)
                throw new Error(parsed.error)
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      return fullResponse
    } catch (error) {
      console.error('Error generating AI response:', error)
      return '申し訳ございません。AIの応答生成中にエラーが発生しました。'
    }
  }

  const startRecording = () => {
    setIsRecording(true)
    // TODO: Implement voice recording
  }

  const stopRecording = () => {
    setIsRecording(false)
    // TODO: Process recorded audio
  }

  const playAudio = (audioUrl: string) => {
    setIsPlaying(true)
    // TODO: Implement audio playback
    setTimeout(() => setIsPlaying(false), 3000) // Placeholder
  }

  const handleBack = () => {
    router.push('/upload')
  }

  if (!conversation) {
    return (
      <div className="container max-w-4xl mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">セッションを初期化中...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={handleBack}
              className="shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <CardTitle className="text-2xl">AIインタビュー</CardTitle>
              <CardDescription>
                AIと音声で対話しながら学習を進めましょう
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Messages Display */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
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
                  {message.audio_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => playAudio(message.audio_url!)}
                      className="mt-2"
                    >
                      {isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            {/* Streaming message */}
            {streamingMessage && (
              <div className="flex justify-start">
                <div className="bg-secondary px-4 py-2 rounded-lg max-w-xs lg:max-w-md">
                  <p className="text-sm">
                    {streamingMessage}
                    <span className="animate-pulse">▋</span>
                  </p>
                </div>
              </div>
            )}
            
            {isLoading && !streamingMessage && (
              <div className="flex justify-start">
                <div className="bg-secondary px-4 py-2 rounded-lg">
                  <p className="text-sm text-muted-foreground">AIが考え中...</p>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={isRecording ? stopRecording : startRecording}
              className={isRecording ? 'bg-red-100' : ''}
            >
              <Mic className="h-4 w-4" />
            </Button>
            <input
              type="text"
              value={inputMessage}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputMessage(e.target.value)}
              placeholder="メッセージを入力..."
              onKeyPress={(e: React.KeyboardEvent) => e.key === 'Enter' && sendMessage()}
              className="flex-1 px-3 py-2 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button onClick={sendMessage} disabled={isLoading || !inputMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 