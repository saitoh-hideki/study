'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { Mic, Send, Play, Pause } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Message {
  id: string
  session_id: string
  role: 'user' | 'assistant'
  message: string
  audio_url: string | null
  created_at: string
}

export default function InterviewPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
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
    // TODO: Load existing messages for current session
    loadMessages()
  }, [])

  const loadMessages = async () => {
    if (!supabase) return
    
    try {
      // TODO: Get current session ID from URL params or context
      const sessionId = 'current-session-id'
      
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

  const sendMessage = async () => {
    if (!inputMessage.trim() || !supabase) return

    setIsLoading(true)
    try {
      // TODO: Get current session ID
      const sessionId = 'current-session-id'
      
      // Save user message
      const { data: userMessage, error: userError } = await supabase
        .from('messages')
        .insert({
          session_id: sessionId,
          role: 'user',
          message: inputMessage,
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

      // TODO: Generate AI response using OpenAI/Claude API
      const aiResponse = await generateAIResponse(inputMessage)

      // Save AI message
      const { data: aiMessage, error: aiError } = await supabase
        .from('messages')
        .insert({
          session_id: sessionId,
          role: 'assistant',
          message: aiResponse,
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

    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateAIResponse = async (userMessage: string): Promise<string> => {
    try {
      // Get current file ID from localStorage
      const fileId = localStorage.getItem('currentFileId')
      
      const response = await fetch('/api/generate-ai-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          sessionId: 'current-session-id', // TODO: Get actual session ID
          fileId: fileId, // Pass file ID for context
          difficulty: 'normal', // TODO: Get from user settings
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate AI response')
      }

      const data = await response.json()
      return data.message
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

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">AIインタビュー</CardTitle>
          <CardDescription>
            AIと音声で対話しながら学習を進めましょう
          </CardDescription>
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
                  <p className="text-sm">{message.message}</p>
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
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-secondary px-4 py-2 rounded-lg">
                  <p className="text-sm text-muted-foreground">AIが考え中...</p>
                </div>
              </div>
            )}
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