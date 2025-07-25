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
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-sky-50 text-sky-600 rounded-full text-sm font-medium border border-sky-200 mb-6">
            <Sparkles className="h-4 w-4" />
            AI Learning Session Setup
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Upload Files and
            <br />
            <span className="text-sky-600">Start Learning with AI</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Upload PDF, Word, text files, or URLs.
            <br />
            AI analyzes the content and prepares for dialogue.
          </p>
        </div>

        {/* Main Upload Card */}
        <Card className="border border-gray-200 bg-white shadow-lg">
          <CardContent className="p-8">
            {/* File Upload Area */}
            <div className="space-y-8">
              <div
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 ${
                  isDragOver
                    ? 'border-sky-500 bg-sky-50'
                    : 'border-sky-300 bg-sky-50 hover:bg-sky-100'
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
                  <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-200">
                    <Upload className="h-10 w-10 text-sky-600" />
                  </div>
                  <div className="space-y-3">
                    <p className="text-xl font-semibold text-gray-900">
                      Drop files or click to select
                    </p>
                    <p className="text-sm text-gray-600">
                      Supports PDF, Word, and text formats
                    </p>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-sky-600" />
                      PDF
                    </span>
                    <span className="flex items-center gap-2">
                      <FileImage className="h-4 w-4 text-sky-600" />
                      Word
                    </span>
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-sky-600" />
                      Text
                    </span>
                  </div>
                </label>
              </div>

              {/* Selected File Display */}
              {selectedFile && (
                <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-sky-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-sky-800">{selectedFile.name}</p>
                      <p className="text-xs text-sky-600">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-sm text-gray-600 font-medium">or</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* URL Input */}
              <div className="space-y-3">
                <label htmlFor="url-input" className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <Link className="h-4 w-4 text-sky-600" />
                  Load from URL
                </label>
                <div className="flex gap-3">
                  <input
                    id="url-input"
                    type="url"
                    placeholder="https://example.com/article"
                    className="flex-1 px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-200 focus:border-sky-500 transition-all"
                  />
                  <Button variant="outline" className="px-6 rounded-xl border-gray-300 hover:bg-gray-50">
                    Load
                  </Button>
                </div>
              </div>

              {/* Upload Button */}
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isLoading}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white text-lg py-4 rounded-xl"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5 mr-2" />
                    Start Learning with AI
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Extracted Text Display */}
        {extractedText && (
          <Card className="mt-8 border border-gray-200 bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">Extracted Text</CardTitle>
              <CardDescription className="text-gray-600">
                You can start the interview based on the following content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-900 leading-relaxed">{extractedText}</pre>
              </div>
              <Button 
                onClick={startInterview} 
                className="w-full bg-sky-600 hover:bg-sky-700 text-white text-lg py-4 rounded-xl"
                size="lg"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Start Interview
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Features Section */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center mx-auto">
              <FileText className="h-6 w-6 text-sky-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Multiple Formats</h3>
            <p className="text-sm text-gray-600">
              Supports PDF, Word, and text files
            </p>
          </div>
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center mx-auto">
              <Sparkles className="h-6 w-6 text-sky-600" />
            </div>
            <h3 className="font-semibold text-gray-900">AI Analysis</h3>
            <p className="text-sm text-gray-600">
              Automatically analyzes content and prepares for dialogue
            </p>
          </div>
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center mx-auto">
              <ArrowRight className="h-6 w-6 text-sky-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Start Immediately</h3>
            <p className="text-sm text-gray-600">
              Start learning immediately after upload completion
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}