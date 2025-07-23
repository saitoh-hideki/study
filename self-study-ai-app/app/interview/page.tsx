'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { Mic, Send, Play, Pause, ArrowLeft, FileText, Volume2, VolumeX } from 'lucide-react'
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
  upload_id: string
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
          id: `user-${Date.now()}`,
          conversation_id: conversation.id,
          role: 'user' as const,
          content: inputMessage,
          audio_url: null,
          created_at: new Date().toISOString()
        }

        setMessages(prev => [...prev, userMessage])
        setInputMessage('')

        // Generate AI response
        const aiResponse = await generateAIResponse(inputMessage, setStreamingMessage)

        const aiMessage = {
          id: `ai-${Date.now()}`,
          conversation_id: conversation.id,
          role: 'assistant' as const,
          content: aiResponse,
          audio_url: null,
          created_at: new Date().toISOString()
        }

        setMessages(prev => [...prev, aiMessage])

        // Save to localStorage
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

  const handleBack = () => {
    router.push('/upload')
  }

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* File Explorer Sidebar */}
      <FileExplorer 
        onFileSelect={handleFileSelect}
        selectedFileId={selectedFile?.id}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {selectedFile ? selectedFile.name : 'AIインタビュー'}
                </h1>
                <p className="text-sm text-gray-500">
                  {selectedFile ? 'ファイルを選択中' : 'ファイルを選択してください'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBack}
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
              <div className="text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  ファイルを選択してください
                </h3>
                <p className="text-gray-500">
                  左側のサイドバーから学習ファイルを選択するか、新しいファイルを作成してください。
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-white">
              <div className="h-full flex flex-col">
                {/* Messages Display */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-4 max-w-4xl mx-auto">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-3 rounded-xl shadow-sm ${
                            message.role === 'user'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm flex-1">{message.content}</p>
                            {message.role === 'assistant' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => generateSpeech(message.content, message.id)}
                                className="flex-shrink-0 mt-1"
                                title="音声で再生"
                                disabled={speechLoading === message.id}
                              >
                                {speechLoading === message.id ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                                ) : (
                                  <Volume2 className="h-4 w-4" />
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
                        <div className="bg-gray-100 px-4 py-3 rounded-xl shadow-sm max-w-xs lg:max-w-md">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm text-gray-800 flex-1">
                              {streamingMessage}
                              <span className="animate-pulse">▋</span>
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => generateSpeech(streamingMessage, 'streaming')}
                              className="flex-shrink-0 mt-1"
                              title="音声で再生"
                              disabled={speechLoading === 'streaming'}
                            >
                              {speechLoading === 'streaming' ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                              ) : (
                                <Volume2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {isLoading && !streamingMessage && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 px-4 py-3 rounded-xl shadow-sm">
                          <p className="text-sm text-gray-600">AIが考え中...</p>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Input Area */}
                <div className="border-t border-gray-200 p-6">
                  <div className="max-w-4xl mx-auto">
                    <div className="flex gap-3 p-4 bg-gray-50 rounded-xl">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`rounded-full ${isRecording ? 'bg-red-100 border-red-300' : 'bg-white'}`}
                      >
                        <Mic className="h-4 w-4" />
                      </Button>
                      <input
                        type="text"
                        value={inputMessage}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputMessage(e.target.value)}
                        placeholder="メッセージを入力..."
                        onKeyPress={(e: React.KeyboardEvent) => e.key === 'Enter' && sendMessage()}
                        className="flex-1 px-4 py-2 text-sm bg-white border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <Button 
                        onClick={sendMessage} 
                        disabled={isLoading || !inputMessage.trim()}
                        className="rounded-full bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
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