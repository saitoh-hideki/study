'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { Mic, Send, Play, Pause, ArrowLeft, FileText, Volume2, VolumeX, BookOpen, Loader2, Sparkles, Brain, MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import FileExplorer from '@/components/file-explorer'

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
  file_id: string
  title: string
  status: string
  created_at: string
}

interface StudyFile {
  id: string
  name: string
  file_name: string
  extracted_text: string
  created_at: string
  user_id: string | null
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
  const [selectedFile, setSelectedFile] = useState<StudyFile | null>(null)
  // 削除予定の状態変数
  const [isAudioEnabled, setIsAudioEnabled] = useState(true) // 削除予定
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)
  const [speechLoading, setSpeechLoading] = useState<string | null>(null) // 音声生成中のメッセージID
  const [isGeneratingReview, setIsGeneratingReview] = useState(false) // レビュー生成中
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
    // This function is now deprecated - use initializeConversationForFile instead
    // Only initialize if there's a file ID in localStorage
    const fileId = localStorage.getItem('currentFileId')
    if (fileId && supabase) {
      initializeConversationForFile(fileId)
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
    console.log('conversation.id type:', typeof conversation.id)
    console.log('conversation.id value:', conversation.id)

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
          console.error('Error details:', {
            conversation_id: conversation.id,
            role: 'user',
            content: inputMessage,
            error: userError
          })
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
        // Anonymous user - save to database as well
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
          console.error('Error saving user message (anonymous):', userError)
          console.error('Error details:', {
            conversation_id: conversation.id,
            role: 'user',
            content: inputMessage,
            error: userError
          })
          return
        }

        setMessages(prev => [...prev, userMessage])
        setInputMessage('')

        // Generate AI response
        const aiResponse = await generateAIResponse(inputMessage, setStreamingMessage)

        // Save AI message to database
        const { data: aiMessage, error: aiError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversation.id,
            role: 'assistant',
            content: aiResponse,
            audio_url: null,
          })
          .select()
          .single()

        if (aiError) {
          console.error('Error saving AI message:', aiError)
          return
        }

        setMessages(prev => [...prev, aiMessage])

        // Also save to localStorage for backup
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
              return fullResponse
            }
            
            try {
              const parsed = JSON.parse(data)
              if (parsed.content) {
                fullResponse += parsed.content
                // ストリーミング中は音声生成を無効にする
                onStream?.(fullResponse)
              }
            } catch (e) {
              console.error('Error parsing streaming data:', e)
            }
          }
        }
      }

      return fullResponse
    } catch (error) {
      console.error('Error generating AI response:', error)
      return '申し訳ございません。エラーが発生しました。'
    }
  }

  const startRecording = () => {
    setIsRecording(true)
    // TODO: Implement actual recording
    setTimeout(() => setIsRecording(false), 3000) // Placeholder
  }

  const stopRecording = () => {
    setIsRecording(false)
    // TODO: Stop recording and send audio
  }

  const generateSpeech = async (text: string, messageId: string) => {
    // テキストの検証を強化
    if (!text || !text.trim()) {
      console.log('No text provided for speech generation')
      return
    }
    
    // テキストが短すぎる場合はスキップ
    if (text.trim().length < 5) {
      console.log('Text too short for speech generation:', text)
      return
    }

    // ローディング状態を設定
    setSpeechLoading(messageId)
    console.log('Starting speech generation for message:', messageId)

    try {
      console.log('Generating speech for complete text:', text.substring(0, 100) + '...')
      
      const response = await fetch('/api/generate-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          language: 'ja',
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to generate speech:', errorText)
        setSpeechLoading(null)
        return
      }

      // 音声データを直接取得
      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      console.log('Audio generated successfully, playing...')
      playAudio(audioUrl)
    } catch (error) {
      console.error('Error generating speech:', error)
    } finally {
      setSpeechLoading(null)
    }
  }

  const playAudio = (audioUrl: string) => {
    // 既存の音声を停止
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
    }

    const audio = new Audio(audioUrl)
    setCurrentAudio(audio)
    
    audio.onended = () => {
      setIsPlaying(false)
      setCurrentAudio(null)
    }
    
    audio.onplay = () => {
      setIsPlaying(true)
    }
    
    audio.onpause = () => {
      setIsPlaying(false)
    }

    audio.play().catch(error => {
      console.error('Error playing audio:', error)
      setIsPlaying(false)
    })
  }

  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
      setIsPlaying(false)
      setCurrentAudio(null)
    }
  }

  // 削除予定の関数
  const toggleAudio = () => {
    // この関数は削除予定
  }

  const handleFileSelect = (file: StudyFile) => {
    setSelectedFile(file)
    localStorage.setItem('currentFileId', file.id)
    // Clear current conversation and messages when switching files
    setConversation(null)
    setMessages([])
    // Initialize new conversation for the selected file
    if (supabase) {
      initializeConversationForFile(file.id)
    }
  }

  const initializeConversationForFile = async (fileId: string) => {
    if (!supabase) return
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      let currentConversation = null

      if (user) {
        // Authenticated user - check if conversation already exists for this file
        const { data: existingConversation, error: conversationError } = await supabase
          .from('sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('file_id', fileId)
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
            .from('sessions')
            .insert({
              user_id: user.id,
              file_id: fileId,
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
        // Anonymous user - create a real session in database
        const { data: newConversation, error: createError } = await supabase
          .from('sessions')
          .insert({
            user_id: null,
            file_id: fileId,
            title: 'AI Interview Session (Anonymous)',
            status: 'active'
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating anonymous conversation:', createError)
          return
        }

        currentConversation = newConversation
      }

      setConversation(currentConversation)
      
      // Load messages from database for both authenticated and anonymous users
      loadMessages(currentConversation.id)

    } catch (error) {
      console.error('Error initializing conversation:', error)
    }
  }

  const generateReview = async () => {
    if (!conversation || !selectedFile) return

    setIsGeneratingReview(true)
    try {
      const response = await fetch('/api/generate-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: conversation.id,
          fileId: selectedFile.id,
          extractedText: selectedFile.extracted_text || '',
        }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('Review generation error:', errorData)
        throw new Error('レビューの生成に失敗しました')
      }

      const data = await response.json()
      console.log('Review generated:', data)
      
      // レビュー生成成功後、レビューページに移動
      router.push('/review')
    } catch (error) {
      console.error('Error generating review:', error)
      alert('レビューの生成に失敗しました: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsGeneratingReview(false)
    }
  }

  const handleBack = () => {
    router.push('/upload')
  }

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-white flex">
      {/* File Explorer Sidebar */}
      <FileExplorer 
        onFileSelect={handleFileSelect}
        selectedFileId={selectedFile?.id}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-xl border-b border-border/30 px-6 py-4 mt-16">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  {selectedFile ? selectedFile.name : 'AIインタビュー'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {selectedFile ? 'AIと対話しながら学習を深めましょう' : 'ファイルを選択してください'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {conversation && messages.length > 0 && (
                <Button
                  onClick={generateReview}
                  disabled={isGeneratingReview}
                  className="bg-white border border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400 shadow-sm transition-all"
                >
                  {isGeneratingReview ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      レビュー生成中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      AIレビューを生成
                    </>
                  )}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/review')}
                className="bg-white border border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400 shadow-sm transition-all"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                レビュー一覧
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBack}
                className="bg-white border border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400 shadow-sm transition-all"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                戻る
              </Button>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {!selectedFile ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto">
                  <FileText className="h-10 w-10 text-gray-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="heading-md text-foreground">
                    ファイルを選択してください
                  </h3>
                  <p className="body-md text-muted-foreground max-w-md">
                    左側のサイドバーから学習ファイルを選択するか、新しいファイルを作成してください。
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-white/50">
              <div className="h-full flex flex-col">
                {/* Messages Display */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-6 max-w-4xl mx-auto">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {message.role === 'assistant' && (
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                            <Brain className="h-4 w-4 text-gray-600" />
                          </div>
                        )}
                        <div
                          className={`max-w-xs lg:max-w-md px-6 py-4 rounded-2xl shadow-sm ${
                            message.role === 'user'
                              ? 'bg-gray-100 text-gray-900 shadow-md'
                              : 'bg-white border border-gray-200 text-gray-900'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className={`text-sm flex-1 leading-relaxed ${message.role === 'user' ? 'font-medium text-gray-900' : 'text-gray-900'}`}>{message.content}</p>
                            {message.role === 'assistant' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => generateSpeech(message.content, message.id)}
                                className="flex-shrink-0 mt-1 hover:bg-gray-100"
                                title="音声で再生"
                                disabled={speechLoading === message.id}
                              >
                                {speechLoading === message.id ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                                ) : (
                                  <Volume2 className="h-4 w-4 text-gray-600" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Streaming message */}
                    {streamingMessage && (
                      <div className="flex justify-start">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                          <Brain className="h-4 w-4 text-gray-600" />
                        </div>
                        <div className="bg-white border border-gray-200 px-6 py-4 rounded-2xl shadow-sm max-w-xs lg:max-w-md">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm text-gray-900 flex-1 leading-relaxed">
                              {streamingMessage}
                              <span className="animate-pulse text-gray-600">▋</span>
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => generateSpeech(streamingMessage, 'streaming')}
                              className="flex-shrink-0 mt-1 hover:bg-gray-100"
                              title="音声で再生"
                              disabled={speechLoading === 'streaming'}
                            >
                              {speechLoading === 'streaming' ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                              ) : (
                                <Volume2 className="h-4 w-4 text-gray-600" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {isLoading && !streamingMessage && (
                      <div className="flex justify-start">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                          <Brain className="h-4 w-4 text-gray-600" />
                        </div>
                        <div className="bg-white border border-gray-200 px-6 py-4 rounded-2xl shadow-sm">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                            <p className="text-sm text-gray-600">AIが考え中...</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Input Area */}
                <div className="border-t border-border/30 p-6 bg-white/80 backdrop-blur-xl">
                  <div className="max-w-4xl mx-auto">
                    <div className="flex items-center w-full px-4 py-3 bg-white border border-border/30 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`rounded-full mr-3 ${isRecording ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                      >
                        <Mic className="h-4 w-4" />
                      </Button>
                      <input
                        type="text"
                        value={inputMessage}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputMessage(e.target.value)}
                        placeholder="メッセージを入力..."
                        onKeyPress={(e: React.KeyboardEvent) => e.key === 'Enter' && sendMessage()}
                        className="flex-1 outline-none text-sm bg-transparent"
                      />
                      <Button 
                        onClick={sendMessage} 
                        disabled={isLoading || !inputMessage.trim()}
                        className="ml-3 bg-gray-900 hover:bg-gray-800 text-white rounded-full p-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Quick Actions */}
                    {conversation && messages.length > 0 && (
                      <div className="mt-4 flex items-center justify-center gap-6">
                        <div className="text-xs text-muted-foreground font-medium">クイックアクション:</div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push('/review')}
                          className="text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                        >
                          <BookOpen className="h-3 w-3 mr-1" />
                          レビュー一覧を見る
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={generateReview}
                          disabled={isGeneratingReview}
                          className="text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                        >
                          {isGeneratingReview ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              生成中...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3 w-3 mr-1" />
                              新しいレビューを生成
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 