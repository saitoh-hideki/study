'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { Mic, Send, Play, Pause, ArrowLeft, FileText, Volume2, VolumeX, BookOpen, Loader2, Sparkles, Brain, MessageSquare, HelpCircle, Trash2, Layers, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import FileExplorer from '@/components/file-explorer'
import FiveWhyModal from '@/components/five-why-modal'
import MECEModal from '@/components/mece-modal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  const [isFiveWhyModalOpen, setIsFiveWhyModalOpen] = useState(false) // 5ホワイモーダルの状態
  const [isMECEModalOpen, setIsMECEModalOpen] = useState(false) // MECEモーダルの状態
  const [selectedText, setSelectedText] = useState('') // 選択されたテキスト
  const [showSelectionTooltip, setShowSelectionTooltip] = useState(false) // 選択ツールチップの表示
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 }) // ツールチップの位置
  const [showSaveSuccess, setShowSaveSuccess] = useState(false) // 5 Whysセーブ成功通知の表示
  const [showMECESaveSuccess, setShowMECESaveSuccess] = useState(false) // MECEセーブ成功通知の表示
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // チャット状態をローカルストレージに保存
  const saveChatState = () => {
    if (typeof window !== 'undefined') {
      const chatState = {
        messages,
        conversation,
        selectedFile,
        timestamp: Date.now()
      }
      localStorage.setItem('chatState', JSON.stringify(chatState))
    }
  }

  // チャット状態をローカルストレージから復元
  const restoreChatState = () => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('chatState')
      if (savedState) {
        try {
          const chatState = JSON.parse(savedState)
          // 24時間以内のデータのみ復元
          const isRecent = Date.now() - chatState.timestamp < 24 * 60 * 60 * 1000
          if (isRecent) {
            setMessages(chatState.messages || [])
            setConversation(chatState.conversation || null)
            setSelectedFile(chatState.selectedFile || null)
            
            // 復元された会話がある場合はメッセージを再読み込み
            if (chatState.conversation && supabase) {
              loadMessages(chatState.conversation.id)
            }
            
            return true
          } else {
            // 古いデータは削除
            localStorage.removeItem('chatState')
          }
        } catch (error) {
          console.error('Failed to restore chat state:', error)
          localStorage.removeItem('chatState')
        }
      }
    }
    return false
  }

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
      // まずローカルストレージからチャット状態を復元を試行
      const restored = restoreChatState()
      if (!restored) {
        // 復元できない場合は通常の初期化
        initializeConversation()
      }
    }
  }, [supabase])

  // グローバルな選択解除イベント
  useEffect(() => {
    const handleGlobalClick = () => {
      if (showSelectionTooltip) {
        setShowSelectionTooltip(false)
      }
    }

    document.addEventListener('click', handleGlobalClick)
    return () => {
      document.removeEventListener('click', handleGlobalClick)
    }
  }, [showSelectionTooltip])

  // ページフォーカス時にチャット状態を復元
  useEffect(() => {
    const handleFocus = () => {
      // チャット状態が空の場合のみ復元を試行
      if (messages.length === 0 && !conversation && !selectedFile) {
        restoreChatState()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [messages.length, conversation, selectedFile])

  // チャット状態が変更された時にローカルストレージに保存
  useEffect(() => {
    if (messages.length > 0 || conversation || selectedFile) {
      saveChatState()
    }
  }, [messages, conversation, selectedFile])

  // ページを離れる前にチャット状態を保存
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveChatState()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  // MECEモーダルの状態を監視
  useEffect(() => {
    console.log('MECEモーダルの状態が変更されました:', isMECEModalOpen)
  }, [isMECEModalOpen])

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
      return 'Sorry, an error occurred.'
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
    // 新しいファイルを選択した時は古いチャット状態をクリア
    localStorage.removeItem('chatState')
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
          // Get file name for the session title
          let sessionTitle = 'AI Interview Session'
          
          try {
            const { data: fileData, error: fileError } = await supabase
              .from('uploaded_files')
              .select('file_name')
              .eq('id', fileId)
              .maybeSingle()

            if (fileError) {
              console.error('Error getting file name:', fileError)
            } else if (fileData?.file_name) {
              sessionTitle = fileData.file_name.replace(/\.[^/.]+$/, '') // Remove file extension
            }
          } catch (error) {
            console.error('Error getting file name:', error)
          }

          const { data: newConversation, error: createError } = await supabase
            .from('sessions')
            .insert({
              user_id: user.id,
              file_id: fileId,
              title: sessionTitle,
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
        // Get file name for the session title
        let sessionTitle = 'AI Interview Session (Anonymous)'
        
        try {
          const { data: fileData, error: fileError } = await supabase
            .from('uploaded_files')
            .select('file_name')
            .eq('id', fileId)
            .maybeSingle()

          if (fileError) {
            console.error('Error getting file name:', fileError)
          } else if (fileData?.file_name) {
            sessionTitle = fileData.file_name.replace(/\.[^/.]+$/, '') // Remove file extension
          }
        } catch (error) {
          console.error('Error getting file name:', error)
        }

        const { data: newConversation, error: createError } = await supabase
          .from('sessions')
          .insert({
            user_id: null,
            file_id: fileId,
            title: sessionTitle,
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
        throw new Error('Failed to generate review')
      }

      const data = await response.json()
      console.log('Review generated:', data)
      
      // レビュー生成成功後、レビューページに移動
      router.push('/review')
    } catch (error) {
      console.error('Error generating review:', error)
      alert('Failed to generate review: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsGeneratingReview(false)
    }
  }

  const handleBack = () => {
    router.push('/upload')
  }

  // テキスト選択処理
  const handleTextSelection = (event: React.MouseEvent) => {
    // 少し遅延を入れて選択状態を確認
    setTimeout(() => {
      const selection = window.getSelection()
      const selectedText = selection?.toString().trim()
      
      if (selectedText && selectedText.length > 0) {
        setSelectedText(selectedText)
        setTooltipPosition({ x: event.clientX, y: event.clientY })
        setShowSelectionTooltip(true)
      } else {
        setShowSelectionTooltip(false)
      }
    }, 100)
  }

  // 5ホワイ分析を選択テキストで開始
  const startFiveWhyWithSelection = () => {
    setIsFiveWhyModalOpen(true)
    setShowSelectionTooltip(false)
  }

  // 通常の5ホワイ分析を開始
  const startFiveWhyNormal = () => {
    setSelectedText('') // 選択テキストをクリア
    setIsFiveWhyModalOpen(true)
    // チャットの状態は保持する（messages, conversation, selectedFile等は変更しない）
  }

  // MECE分析を開始
  const startMECEAnalysis = () => {
    setSelectedText('') // 選択テキストをクリア
    setIsMECEModalOpen(true)
    // チャットの状態は保持する（messages, conversation, selectedFile等は変更しない）
  }

  // 選択ツールチップを非表示
  const hideSelectionTooltip = () => {
    setShowSelectionTooltip(false)
  }

  // チャット履歴をクリアする関数
  const clearChatHistory = () => {
    if (window.confirm('チャット履歴をクリアしますか？この操作は元に戻せません。')) {
      setMessages([])
      setConversation(null)
      setStreamingMessage('')
      setInputMessage('')
      // ローカルストレージからも削除
      localStorage.removeItem('chatState')
      // 現在のファイルは保持
      if (selectedFile && supabase) {
        initializeConversationForFile(selectedFile.id)
      }
    }
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
        <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200 px-6 py-4 mt-16">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl flex items-center justify-center shadow-sm">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    {selectedFile ? selectedFile.name : 'AI Interview'}
                  </h1>
                  <p className="text-sm text-gray-600">
                    {selectedFile ? 'Deepen your learning through dialogue with AI' : 'Please select a file'}
                  </p>
                </div>
              </div>
              
              {/* Status Indicator */}
              {selectedFile && (
                <div className="flex items-center gap-2 px-3 py-1 bg-sky-50 border border-sky-200 rounded-full">
                  <div className="w-2 h-2 bg-sky-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-sky-700">Active Session</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {conversation && messages.length > 0 && (
                <Button
                  onClick={generateReview}
                  disabled={isGeneratingReview}
                  className="bg-white border border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400 shadow-sm transition-all duration-200"
                >
                  {isGeneratingReview ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Review...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate AI Review
                    </>
                  )}
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white border border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400 shadow-sm transition-all duration-200"
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Analyst
                    <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={startFiveWhyNormal}>
                    <HelpCircle className="h-4 w-4 mr-2" />
                    5 Whys Analyst
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={startMECEAnalysis}>
                    <Layers className="h-4 w-4 mr-2" />
                    MECE Analyst
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/review')}
                className="bg-white border border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400 shadow-sm transition-all duration-200"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Review List
              </Button>
              {selectedFile && messages.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearChatHistory}
                  className="bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 shadow-sm transition-all duration-200"
                  title="チャット履歴をクリア"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Chat
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleBack}
                className="bg-white border border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400 shadow-sm transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {!selectedFile ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-8 max-w-md mx-auto px-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-sky-50 to-sky-100 rounded-3xl flex items-center justify-center mx-auto shadow-sm border border-sky-200">
                    <FileText className="h-12 w-12 text-sky-600" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    <div className="w-2 h-2 bg-sky-600 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-gray-900">
                    No File Selected
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Select a learning file from the sidebar or upload a new document to start your AI-powered learning session.
                  </p>
                  <div className="flex items-center justify-center gap-4 pt-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="w-2 h-2 bg-sky-400 rounded-full"></div>
                      <span>Choose from existing files</span>
                    </div>
                    <div className="w-px h-4 bg-gray-300"></div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="w-2 h-2 bg-sky-400 rounded-full"></div>
                      <span>Upload new content</span>
                    </div>
                  </div>
                </div>
                <div className="pt-4">
                  <Button
                    onClick={handleBack}
                    className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-3 rounded-xl shadow-sm transition-all duration-200 hover:shadow-md"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Go to Upload
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-white/50">
              <div className="h-full flex flex-col">
                {/* Messages Display */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
                    {messages.map((message, index) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-in`}
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        {message.role === 'assistant' && (
                          <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                            <Brain className="h-4 w-4 text-sky-600" />
                          </div>
                        )}
                        <div
                          className={`max-w-xs lg:max-w-md px-6 py-4 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md ${
                            message.role === 'user'
                              ? 'bg-sky-100 text-gray-900 shadow-md hover:shadow-lg'
                              : 'bg-white border border-gray-200 text-gray-900 hover:border-sky-200'
                          }`}
                          onMouseUp={handleTextSelection}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className={`text-sm flex-1 leading-relaxed ${message.role === 'user' ? 'font-medium text-gray-900' : 'text-gray-900'}`}>{message.content}</p>
                            {message.role === 'assistant' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => generateSpeech(message.content, message.id)}
                                className="flex-shrink-0 mt-1 hover:bg-sky-50"
                                title="Play audio"
                                disabled={speechLoading === message.id}
                              >
                                {speechLoading === message.id ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-sky-300 border-t-sky-600" />
                                ) : (
                                  <Volume2 className="h-4 w-4 text-sky-600" />
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
                        <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                          <Brain className="h-4 w-4 text-sky-600" />
                        </div>
                        <div 
                          className="bg-white border border-gray-200 px-6 py-4 rounded-2xl shadow-sm max-w-xs lg:max-w-md"
                          onMouseUp={handleTextSelection}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm text-gray-900 flex-1 leading-relaxed">
                              {streamingMessage}
                              <span className="animate-pulse text-sky-600">▋</span>
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => generateSpeech(streamingMessage, 'streaming')}
                              className="flex-shrink-0 mt-1 hover:bg-sky-50"
                              title="Play audio"
                              disabled={speechLoading === 'streaming'}
                            >
                              {speechLoading === 'streaming' ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-sky-300 border-t-sky-600" />
                              ) : (
                                <Volume2 className="h-4 w-4 text-sky-600" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {isLoading && !streamingMessage && (
                      <div className="flex justify-start">
                        <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                          <Brain className="h-4 w-4 text-sky-600" />
                        </div>
                        <div className="bg-white border border-gray-200 px-6 py-4 rounded-2xl shadow-sm">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-sky-600" />
                            <p className="text-sm text-sky-600">AI is thinking...</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Input Area */}
                <div className="border-t border-gray-200 p-6 bg-white/80 backdrop-blur-xl">
                  <div className="max-w-4xl mx-auto">
                    <div className="flex items-center w-full px-4 py-3 bg-white border border-gray-300 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-sky-200 focus-within:border-sky-500 transition-all duration-200 hover:shadow-md">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`rounded-full mr-3 transition-all duration-200 ${
                          isRecording 
                            ? 'bg-red-100 text-red-600 hover:bg-red-200 shadow-sm' 
                            : 'text-gray-500 hover:text-sky-600 hover:bg-sky-50 hover:shadow-sm'
                        }`}
                      >
                        <Mic className="h-4 w-4" />
                      </Button>
                      <input
                        type="text"
                        value={inputMessage}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputMessage(e.target.value)}
                        placeholder="Type your message..."
                        onKeyPress={(e: React.KeyboardEvent) => e.key === 'Enter' && sendMessage()}
                        className="flex-1 outline-none text-sm bg-transparent placeholder-gray-400"
                      />
                      <Button 
                        onClick={sendMessage} 
                        disabled={isLoading || !inputMessage.trim()}
                        className="ml-3 bg-sky-600 hover:bg-sky-700 text-white rounded-full p-2 transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Quick Actions */}
                    {selectedFile && (
                      <div className="mt-6 flex items-center justify-center">
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl px-6 py-3 flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-sky-500 rounded-full"></div>
                            <span className="text-xs font-medium text-gray-700">Quick Actions</span>
                          </div>
                          <div className="w-px h-4 bg-gray-300"></div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={startFiveWhyNormal}
                            className="text-xs text-gray-600 hover:text-sky-600 hover:bg-sky-50 transition-all duration-200 rounded-lg"
                          >
                            <HelpCircle className="h-3 w-3 mr-1" />
                            5 Whys Analysis
                          </Button>
                          <div className="w-px h-4 bg-gray-300"></div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={startMECEAnalysis}
                            className="text-xs text-gray-600 hover:text-sky-600 hover:bg-sky-50 transition-all duration-200 rounded-lg"
                          >
                            <Layers className="h-3 w-3 mr-1" />
                            MECE Analysis
                          </Button>
                          <div className="w-px h-4 bg-gray-300"></div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push('/review')}
                            className="text-xs text-gray-600 hover:text-sky-600 hover:bg-sky-50 transition-all duration-200 rounded-lg"
                          >
                            <BookOpen className="h-3 w-3 mr-1" />
                            View Review List
                          </Button>
                          {conversation && messages.length > 0 && (
                            <>
                              <div className="w-px h-4 bg-gray-300"></div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={generateReview}
                                disabled={isGeneratingReview}
                                className="text-xs text-gray-600 hover:text-sky-600 hover:bg-sky-50 transition-all duration-200 rounded-lg"
                              >
                                {isGeneratingReview ? (
                                  <>
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    Generate New Review
                                  </>
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5ホワイモーダル */}
      <FiveWhyModal
        isOpen={isFiveWhyModalOpen}
        onClose={() => setIsFiveWhyModalOpen(false)}
        initialTopic={selectedText}
        onSendToChat={async (summary) => {
          // 5 Whys分析結果をチャット履歴に追加
          if (conversation) {
            const newMessage: Message = {
              id: `temp-${Date.now()}`,
              conversation_id: conversation.id,
              role: 'user',
              content: summary,
              audio_url: null,
              created_at: new Date().toISOString()
            }
            
            // メッセージをデータベースに保存
            if (supabase) {
              const { data: savedMessage, error } = await supabase
                .from('messages')
                .insert({
                  conversation_id: conversation.id,
                  role: 'user',
                  content: summary
                })
                .select()
                .single()
              
              if (savedMessage) {
                // 保存されたメッセージで更新
                setMessages(prev => [...prev, savedMessage])
              } else {
                // エラーの場合は一時的なメッセージを使用
                setMessages(prev => [...prev, newMessage])
              }
            } else {
              setMessages(prev => [...prev, newMessage])
            }
            
            // AI応答を生成
            generateAIResponse(summary)
          }
          setIsFiveWhyModalOpen(false)
        }}
        onSaveSuccess={() => {
          // セーブ成功通知を表示
          setShowSaveSuccess(true)
          // 3秒後に通知を非表示
          setTimeout(() => {
            setShowSaveSuccess(false)
          }, 3000)
        }}
      />

      {/* MECEモーダル */}
      <MECEModal
        isOpen={isMECEModalOpen}
        onClose={() => {
          console.log('MECEモーダルを閉じます')
          setIsMECEModalOpen(false)
        }}
        initialTheme={selectedText}
        onSendToChat={async (summary) => {
          // MECE分析結果をチャット履歴に追加
          if (conversation) {
            const newMessage: Message = {
              id: `temp-${Date.now()}`,
              conversation_id: conversation.id,
              role: 'user',
              content: summary,
              audio_url: null,
              created_at: new Date().toISOString()
            }
            
            // メッセージをデータベースに保存
            if (supabase) {
              const { data: savedMessage, error } = await supabase
                .from('messages')
                .insert({
                  conversation_id: conversation.id,
                  role: 'user',
                  content: summary
                })
                .select()
                .single()
              
              if (savedMessage) {
                // 保存されたメッセージで更新
                setMessages(prev => [...prev, savedMessage])
              } else {
                // エラーの場合は一時的なメッセージを使用
                setMessages(prev => [...prev, newMessage])
              }
            } else {
              setMessages(prev => [...prev, newMessage])
            }
            
            // AI応答を生成
            generateAIResponse(summary)
          }
          setIsMECEModalOpen(false)
        }}
        onSaveSuccess={() => {
          // MECEセーブ成功通知を表示
          setShowMECESaveSuccess(true)
          // 3秒後に通知を非表示
          setTimeout(() => {
            setShowMECESaveSuccess(false)
          }, 3000)
        }}
      />

      {/* テキスト選択ツールチップ */}
      {showSelectionTooltip && (
        <div
          className="fixed z-50 bg-white border border-gray-300 rounded-xl shadow-xl p-3 animate-fade-in"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y - 60,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-sky-500 rounded-full animate-pulse"></div>
            <Button
              size="sm"
              onClick={startFiveWhyWithSelection}
              className="bg-sky-600 hover:bg-sky-700 text-white text-xs shadow-sm transition-all duration-200 hover:shadow-md"
            >
              <HelpCircle className="h-3 w-3 mr-1" />
              Start 5 Whys Analysis
            </Button>
          </div>
        </div>
      )}

      {/* ツールチップを非表示にするためのオーバーレイ */}
      {showSelectionTooltip && (
        <div
          className="fixed inset-0 z-40"
          onClick={hideSelectionTooltip}
        />
      )}

      {/* 5 Whysセーブ成功通知 */}
      {showSaveSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-green-600 rounded-full"></div>
            </div>
            <div>
              <p className="text-sm font-medium text-green-800">
                5 Whys analysis saved successfully
              </p>
              <p className="text-xs text-green-600">
                You can check it in the history page
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/five-why')}
              className="text-xs text-green-600 hover:text-green-800 hover:bg-green-100"
            >
              View History
            </Button>
          </div>
        </div>
      )}

      {/* MECEセーブ成功通知 */}
      {showMECESaveSuccess && (
        <div className="fixed top-20 right-4 z-50 bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-lg animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">
                MECE analysis saved successfully
              </p>
              <p className="text-xs text-blue-600">
                You can check it in the history page
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/mece')}
              className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-100"
            >
              View History
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 