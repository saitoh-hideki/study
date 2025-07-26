'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { BookOpen, Sparkles, Download, Save, Loader2, Plus, Trash2, MessageSquare, Brain } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Chapter {
  id: string
  title: string
  content: string
}

interface BookBuilderModalProps {
  isOpen: boolean
  onClose: () => void
  conversationId?: string
  messages?: any[]
}

export default function BookBuilderModal({ isOpen, onClose, conversationId, messages }: BookBuilderModalProps) {
  const [bookTitle, setBookTitle] = useState('')
  const [introduction, setIntroduction] = useState('')
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false)
  const [isAskingAI, setIsAskingAI] = useState<string | null>(null) // どの章でAIに相談中か
  const [aiAdvice, setAiAdvice] = useState('')
  const [showAIChat, setShowAIChat] = useState(false)
  const [aiMessages, setAiMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([])
  const [userInput, setUserInput] = useState('')
  const [selectedText, setSelectedText] = useState('')
  const [showSelectionTooltip, setShowSelectionTooltip] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  // 削除: useEffect, isAuthenticated, getSession など認証関連
  // Ask AIボタンのdisabled条件から!isAuthenticatedを削除

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [aiMessages])

  // テキスト選択ハンドラー
  const handleTextSelection = (event: React.MouseEvent) => {
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

  // 選択ツールチップを非表示
    const hideSelectionTooltip = () => {
    setShowSelectionTooltip(false)
  }

  if (!isOpen) return null

  const generateChapterOutline = async () => {
    if (!conversationId || !messages) return

    setIsGeneratingOutline(true)
    try {
      const conversationText = messages
        .map(msg => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`)
        .join('\n')

      const response = await fetch('/api/generate-book-outline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          conversationText,
          bookTitle: bookTitle || 'Learning Summary',
          introduction
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate outline')
      }

      const data = await response.json()
      setChapters(data.chapters || [])
    } catch (error) {
      console.error('Error generating outline:', error)
      alert('Failed to generate chapter outline')
    } finally {
      setIsGeneratingOutline(false)
    }
  }

  const addChapter = () => {
    const newChapter: Chapter = {
      id: Date.now().toString(),
      title: `Chapter ${chapters.length + 1}`,
      content: ''
    }
    setChapters([...chapters, newChapter])
  }

  const updateChapter = (id: string, field: 'title' | 'content', value: string) => {
    setChapters(chapters.map(chapter => 
      chapter.id === id ? { ...chapter, [field]: value } : chapter
    ))
  }

  const removeChapter = (id: string) => {
    setChapters(chapters.filter(chapter => chapter.id !== id))
  }

  const askAIForAdvice = async () => {
    if (!bookTitle.trim()) {
      alert('Please enter a book title')
      return
    }

    setShowAIChat(true)
    setAiMessages([]) // Clear previous messages
  }

  const sendMessage = async () => {
    if (!userInput.trim()) return

    const userMessage = userInput.trim()
    setAiMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setUserInput('')
    setIsAskingAI('main')

    try {
      const response = await fetch('/api/generate-ai-advice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookTitle,
          introduction,
          chapters,
          userMessage
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get AI advice')
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      let advice = ''
      const decoder = new TextDecoder()
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') break
            
            try {
              const parsed = JSON.parse(data)
              if (parsed.content) {
                advice += parsed.content
                // Update AI message in real-time
                setAiMessages(prev => {
                  const newMessages = [...prev]
                  if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'assistant') {
                    newMessages[newMessages.length - 1].content = advice
                  } else {
                    newMessages.push({ role: 'assistant', content: advice })
                  }
                  return newMessages
                })
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      setAiAdvice(advice)
    } catch (error) {
      console.error('Error getting AI advice:', error)
      setAiMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error while providing advice. Please try again.' }])
    } finally {
      setIsAskingAI(null)
    }
  }

  const saveBook = async () => {
    if (!bookTitle.trim()) {
      alert('Please enter a book title')
      return
    }

    try {
      const response = await fetch('/api/save-book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: bookTitle,
          introduction,
          chapters: chapters || []
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to save book')
      }

      const data = await response.json()
      if (data.success) {
        alert('Book saved to portfolio successfully!')
        onClose()
      } else {
        alert('Failed to save book')
      }
    } catch (error) {
      console.error('Error saving book:', error)
      alert(`Failed to save book: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const downloadBook = () => {
    const bookContent = `
# ${bookTitle}

${introduction}

${chapters.map((chapter, index) => `
## ${chapter.title}

${chapter.content}
`).join('\n')}
    `.trim()

    const blob = new Blob([bookContent], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${bookTitle || 'book'}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden border border-gray-100 relative">
        {/* Floating AI Chat Button */}
        <div className="absolute top-8 right-20 z-10">
          <Button
            onClick={() => setShowAIChat(!showAIChat)}
            className={`rounded-full w-14 h-14 shadow-lg transition-all duration-200 ${
              showAIChat 
                ? 'bg-sky-600 hover:bg-sky-700 text-white' 
                : 'bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-sky-300'
            }`}
          >
            <Brain className="h-6 w-6" />
          </Button>
        </div>

        {/* Floating AI Chat Panel */}
        {showAIChat && (
          <div className="absolute top-24 right-8 w-80 h-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-10 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-sky-50 to-blue-50 rounded-t-2xl">
              <div>
                <h3 className="font-semibold text-gray-900">AI Writing Partner</h3>
                <p className="text-xs text-gray-600">Chat while writing</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAIChat(false)}
                className="text-gray-500 hover:text-gray-700 h-8 w-8 p-0"
              >
                ✕
              </Button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-3">
                {aiMessages.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Brain className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Ask me anything about your book!</p>
                    <p className="text-xs text-gray-400 mt-1">I can help with structure, content, and writing tips</p>
                  </div>
                )}
                {aiMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg p-3 transition-all duration-200 ${
                        message.role === 'user'
                          ? 'bg-sky-600 text-white'
                          : 'bg-gray-50 text-gray-900 border border-gray-200 hover:bg-gray-100 hover:shadow-md'
                      }`}
                    >
                      <p 
                        className="text-sm whitespace-pre-wrap select-text"
                        onMouseUp={handleTextSelection}
                      >
                        {message.content}
                      </p>
                      {message.role === 'assistant' && (
                        <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                          <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                          Select text to add to your book
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isAskingAI === 'main' && (
                  <div className="flex justify-start">
                    <div className="bg-gray-50 text-gray-900 rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
            <div className="p-4 border-t border-gray-100">
              <div className="flex gap-2">
                <Input
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Ask about your book..."
                  className="flex-1 text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!userInput.trim() || isAskingAI === 'main'}
                  className="bg-sky-600 hover:bg-sky-700 text-white px-3"
                  size="sm"
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-sky-600 rounded-2xl flex items-center justify-center shadow-sm">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Book Builder</h2>
              <p className="text-sm text-gray-600">Organize your thoughts into a book</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl"
          >
            ✕
          </Button>
        </div>

        <div className="p-8 overflow-y-auto max-h-[calc(95vh-200px)]">
          <div className="space-y-8">
            {/* Book Information */}
            <Card className="border-2 border-gray-100 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Book Information</CardTitle>
                <CardDescription>Set the title and introduction for your book</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <Input
                    value={bookTitle}
                    onChange={(e) => setBookTitle(e.target.value)}
                    placeholder="Learning Summary"
                    className="w-full transition-all duration-200"
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.currentTarget.classList.add('border-sky-400', 'bg-sky-50')
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove('border-sky-400', 'bg-sky-50')
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      e.currentTarget.classList.remove('border-sky-400', 'bg-sky-50')
                      const text = e.dataTransfer.getData('text/plain')
                      if (text) {
                        setBookTitle(text)
                      }
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Introduction
                  </label>
                  <Textarea
                    value={introduction}
                    onChange={(e) => setIntroduction(e.target.value)}
                    placeholder="Write a description of your book..."
                    rows={3}
                    className="w-full transition-all duration-200"
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.currentTarget.classList.add('border-sky-400', 'bg-sky-50')
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove('border-sky-400', 'bg-sky-50')
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      e.currentTarget.classList.remove('border-sky-400', 'bg-sky-50')
                      const text = e.dataTransfer.getData('text/plain')
                      if (text) {
                        setIntroduction(text)
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Chapters */}
            <Card className="border-2 border-gray-100 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Chapters</CardTitle>
                    <CardDescription>Create chapters to organize your thoughts</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={addChapter}
                      className="bg-sky-600 hover:bg-sky-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Chapter
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {chapters.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="mb-4">Click "Add Chapter" to start organizing your thoughts</p>
                      <p className="text-sm text-gray-400">AI Reference provides chapter suggestions based on your conversation</p>
                    </div>
                  )}
                  {chapters.map((chapter, index) => (
                    <div key={chapter.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-6 h-6 bg-sky-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-sky-700">{index + 1}</span>
                        </div>
                        <Input
                          value={chapter.title}
                          onChange={(e) => updateChapter(chapter.id, 'title', e.target.value)}
                          className="flex-1 font-medium transition-all duration-200"
                          placeholder="Enter chapter title"
                          onDragOver={(e) => {
                            e.preventDefault()
                            e.currentTarget.classList.add('border-sky-400', 'bg-sky-50')
                          }}
                          onDragLeave={(e) => {
                            e.currentTarget.classList.remove('border-sky-400', 'bg-sky-50')
                          }}
                          onDrop={(e) => {
                            e.preventDefault()
                            e.currentTarget.classList.remove('border-sky-400', 'bg-sky-50')
                            const text = e.dataTransfer.getData('text/plain')
                            if (text) {
                              updateChapter(chapter.id, 'title', text)
                            }
                          }}
                        />
                        <Button
                          onClick={() => removeChapter(chapter.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Textarea
                        value={chapter.content}
                        onChange={(e) => updateChapter(chapter.id, 'content', e.target.value)}
                        placeholder="Write your thoughts and content for this chapter..."
                        rows={6}
                        className="w-full resize-none transition-all duration-200"
                        onDragOver={(e) => {
                          e.preventDefault()
                          e.currentTarget.classList.add('border-sky-400', 'bg-sky-50')
                        }}
                        onDragLeave={(e) => {
                          e.currentTarget.classList.remove('border-sky-400', 'bg-sky-50')
                        }}
                        onDrop={(e) => {
                          e.preventDefault()
                          e.currentTarget.classList.remove('border-sky-400', 'bg-sky-50')
                          const text = e.dataTransfer.getData('text/plain')
                          if (text) {
                            updateChapter(chapter.id, 'content', text)
                          }
                        }}
                      />
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                        <span className="w-1 h-1 bg-sky-400 rounded-full"></span>
                        Organizing your own thoughts is important. Use AI advice as reference only.
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex gap-2">
                <Button
                  onClick={saveBook}
                  className="bg-sky-600 hover:bg-sky-700 text-white"
                  disabled={!bookTitle.trim()}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
              <Button
                onClick={downloadBook}
                variant="outline"
                disabled={!bookTitle.trim()}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </div>
      </div>

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
              onClick={() => {
                // 選択されたテキストをBook Builderの入力欄に追加
                if (selectedText) {
                  // タイトルが空の場合はタイトルに追加
                  if (!bookTitle.trim()) {
                    setBookTitle(selectedText)
                  }
                  // イントロダクションが空の場合はイントロダクションに追加
                  else if (!introduction.trim()) {
                    setIntroduction(selectedText)
                  }
                  // それ以外の場合は新しい章として追加
                  else {
                    const newChapter: Chapter = {
                      id: Date.now().toString(),
                      title: `Chapter ${chapters.length + 1}`,
                      content: selectedText
                    }
                    setChapters([...chapters, newChapter])
                  }
                }
                setShowSelectionTooltip(false)
              }}
              className="bg-sky-600 hover:bg-sky-700 text-white text-xs shadow-sm transition-all duration-200 hover:shadow-md"
            >
              <BookOpen className="h-3 w-3 mr-1" />
              Add to Book Builder
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
    </div>
  )
} 