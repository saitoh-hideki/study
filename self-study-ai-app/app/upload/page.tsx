'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileUp, Link, FileText, FileImage } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [extractedText, setExtractedText] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
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
    <div className="container max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">ファイルアップロード</CardTitle>
          <CardDescription>
            学習したい資料をアップロードしてください。PDF、Word、テキストファイル、またはURLに対応しています。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center space-y-4"
            >
              <FileUp className="h-12 w-12 text-muted-foreground" />
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  クリックしてファイルを選択
                </p>
                <p className="text-xs text-muted-foreground">
                  またはドラッグ＆ドロップ
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  PDF
                </span>
                <span className="flex items-center gap-1">
                  <FileImage className="h-3 w-3" />
                  Word
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Text
                </span>
              </div>
            </label>
          </div>

          {selectedFile && (
            <div className="bg-secondary rounded-lg p-4">
              <p className="text-sm font-medium">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">または</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="space-y-2">
            <label htmlFor="url-input" className="text-sm font-medium">
              URLから読み込み
            </label>
            <div className="flex gap-2">
              <input
                id="url-input"
                type="url"
                placeholder="https://example.com/article"
                className="flex-1 px-3 py-2 text-sm border border-input rounded-md"
              />
              <Button variant="outline" size="icon">
                <Link className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isLoading}
            className="w-full"
          >
            {isLoading ? 'アップロード中...' : 'アップロード'}
          </Button>
        </CardContent>
      </Card>

      {extractedText && (
        <Card>
          <CardHeader>
            <CardTitle>抽出されたテキスト</CardTitle>
            <CardDescription>
              以下の内容に基づいてインタビューを開始できます
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-secondary rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm">{extractedText}</pre>
            </div>
            <Button onClick={startInterview} className="w-full" size="lg">
              インタビューを開始
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}