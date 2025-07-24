'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, Save, Edit, Loader2, CheckCircle } from 'lucide-react'

interface Review {
  title: string
  content: string
  summary: string
  ai_generated: boolean
}

interface ReviewModalProps {
  isOpen: boolean
  onClose: () => void
  review: Review | null
  onSave: (review: Review) => Promise<void>
  isLoading?: boolean
}

export default function ReviewModal({ 
  isOpen, 
  onClose, 
  review, 
  onSave, 
  isLoading = false 
}: ReviewModalProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  if (!isOpen || !review) return null

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(review)
      setSaveSuccess(true)
      setTimeout(() => {
        setSaveSuccess(false)
        onClose()
      }, 2000)
    } catch (error) {
      console.error('Error saving review:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">学習レビュー</h2>
              <p className="text-sm text-gray-500">AIが生成した本日の学習レビュー</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-6">
            {/* Summary Card */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-blue-900">要約</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-800 leading-relaxed">{review.summary}</p>
              </CardContent>
            </Card>

            {/* Full Review */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">{review.title}</CardTitle>
                <CardDescription className="text-gray-600">
                  AIが会話内容を分析して生成した学習レビュー
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-gray max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {review.content}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            AI生成済み
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              閉じる
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || saveSuccess}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : saveSuccess ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  保存完了
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  レビューを保存
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 