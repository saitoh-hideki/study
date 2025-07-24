'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileUp, Link, FileText, FileImage, Upload, ArrowRight, Sparkles, Loader2, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [extractedText, setExtractedText] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Get current user ID
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)
    }
    getUser()
  }, [supabase.auth])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      // Send actual user ID or null if not authenticated
      formData.append('userId', userId || '')

      const response = await fetch('/api/upload-file', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const data = await response.json()
      setExtractedText(data.extractedText)
      
      // Store file ID for interview session
      localStorage.setItem('currentFileId', data.fileId)
      
    } catch (error) {
      console.error('Upload error:', error)
      alert('アップロードに失敗しました: ' + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const startInterview = () => {
    // TODO: Create session and redirect to interview page
    router.push('/interview')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="container max-w-4xl mx-auto px-6 py-12 pt-24">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 text-primary rounded-full text-sm font-medium border border-primary/10 mb-6">
            <Sparkles className="h-4 w-4" />
            AI学習セッション準備
          </div>
          <h1 className="heading-lg text-foreground mb-4">
            ファイルをアップロードして
            <br />
            <span className="text-primary">AIと学習を始めよう</span>
          </h1>
          <p className="body-lg text-muted-foreground max-w-2xl mx-auto">
            PDF、Word、テキストファイル、またはURLをアップロードしてください。
            <br />
            AIが内容を分析し、対話の準備を整えます。
          </p>
        </div>

        {/* Main Upload Card */}
        <Card className="border border-border/30 bg-white shadow-lg">
          <CardContent className="p-8">
            {/* File Upload Area */}
            <div className="space-y-8">
              <div
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 ${
                  isDragOver
                    ? 'border-primary bg-primary/5'
                    : 'border-blue-300 bg-blue-50 hover:bg-blue-100'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileSelect}
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center space-y-6"
                >
                  <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-border/20">
                    <Upload className="h-10 w-10 text-primary" />
                  </div>
                  <div className="space-y-3">
                    <p className="text-xl font-semibold text-foreground">
                      ファイルをドロップ またはクリックで選択
                    </p>
                    <p className="text-sm text-muted-foreground">
                      PDF、Word、テキスト形式に対応
                    </p>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      PDF
                    </span>
                    <span className="flex items-center gap-2">
                      <FileImage className="h-4 w-4" />
                      Word
                    </span>
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Text
                    </span>
                  </div>
                </label>
              </div>

              {/* Selected File Display */}
              {selectedFile && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800">{selectedFile.name}</p>
                      <p className="text-xs text-green-600">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-sm text-muted-foreground font-medium">または</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* URL Input */}
              <div className="space-y-3">
                <label htmlFor="url-input" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  URLから読み込み
                </label>
                <div className="flex gap-3">
                  <input
                    id="url-input"
                    type="url"
                    placeholder="https://example.com/article"
                    className="flex-1 px-4 py-3 text-sm border border-border/30 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  <Button variant="outline" className="px-6 rounded-xl border-border/30 hover:bg-muted/50">
                    読み込む
                  </Button>
                </div>
              </div>

              {/* Upload Button */}
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isLoading}
                className="w-full btn-primary text-lg py-4 rounded-xl"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    アップロード中...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5 mr-2" />
                    AIと学習を始める
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Extracted Text Display */}
        {extractedText && (
          <Card className="mt-8 border border-border/30 bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-foreground">抽出されたテキスト</CardTitle>
              <CardDescription className="body-md">
                以下の内容に基づいてインタビューを開始できます
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 border border-border/30 rounded-xl p-6 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">{extractedText}</pre>
              </div>
              <Button 
                onClick={startInterview} 
                className="w-full btn-primary text-lg py-4 rounded-xl"
                size="lg"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                インタビューを開始
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Features Section */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-foreground">多様な形式対応</h3>
            <p className="text-sm text-muted-foreground">
              PDF、Word、テキストファイルに対応
            </p>
          </div>
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto">
              <Sparkles className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-foreground">AI分析</h3>
            <p className="text-sm text-muted-foreground">
              自動で内容を分析し、対話の準備を整えます
            </p>
          </div>
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto">
              <ArrowRight className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-foreground">即座に開始</h3>
            <p className="text-sm text-muted-foreground">
              アップロード完了後、すぐに学習を開始できます
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}