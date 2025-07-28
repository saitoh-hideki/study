'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Image, Sparkles, Download, Save, Loader2, RefreshCw, ArrowLeft } from 'lucide-react'

interface ThinkingImageModalProps {
  isOpen: boolean
  onClose: () => void
  conversationId?: string
  messages?: any[]
  initialData?: {
    theme?: string
    concept?: string
  }
}

export default function ThinkingImageModal({ isOpen, onClose, conversationId, messages, initialData }: ThinkingImageModalProps) {
  const [title, setTitle] = useState('')
  const [theme, setTheme] = useState('')
  const [customPrompt, setCustomPrompt] = useState('')
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  // 初期データがある場合は設定
  useEffect(() => {
    if (isOpen && initialData) {
      if (initialData.theme) {
        setTheme(initialData.theme)
        // AIコーチから渡されたテーマをタイトルにも設定
        setTitle(initialData.theme)
      }
      if (initialData.concept) setCustomPrompt(initialData.concept)
    }
  }, [isOpen, initialData])

  if (!isOpen) return null

  const generateImage = async () => {
    if (!theme.trim()) return

    setIsGenerating(true)
    try {
      // Extract theme from conversation if theme is empty
      let prompt = theme
      if (!theme.trim() && messages && messages.length > 0) {
        const conversationText = messages
          .map(msg => msg.content)
          .join('\n')
        prompt = `Learning content: ${conversationText.substring(0, 200)}...`
      }

      // Add custom prompt if provided
      if (customPrompt.trim()) {
        prompt += `\n\nAdditional instructions: ${customPrompt}`
      }

      const response = await fetch('/api/generate-thinking-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          conversationId,
          style: 'conceptual, artistic, educational'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate image')
      }

      const data = await response.json()
      setGeneratedImages(prev => [...prev, data.imageUrl])
      setSelectedImage(data.imageUrl)
    } catch (error) {
      console.error('Error generating image:', error)
      alert('Failed to generate image')
    } finally {
      setIsGenerating(false)
    }
  }

  const regenerateImage = async () => {
    if (!theme.trim()) return

    setIsGenerating(true)
    try {
      let prompt = theme
      if (customPrompt.trim()) {
        prompt += `\n\nAdditional instructions: ${customPrompt}`
      }

      const response = await fetch('/api/generate-thinking-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          conversationId,
          style: 'conceptual, artistic, educational, different variation'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to regenerate image')
      }

      const data = await response.json()
      setGeneratedImages(prev => [...prev, data.imageUrl])
      setSelectedImage(data.imageUrl)
    } catch (error) {
      console.error('Error regenerating image:', error)
      alert('Failed to regenerate image')
    } finally {
      setIsGenerating(false)
    }
  }

  const saveImage = async () => {
    if (!selectedImage || !title.trim()) {
      alert('Please enter a title and select an image')
      return
    }

    try {
      const response = await fetch('/api/save-thinking-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          theme,
          prompt: customPrompt,
          imageUrl: selectedImage
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save image')
      }

      const data = await response.json()
      if (data.success) {
        alert('Image saved to portfolio successfully!')
        onClose()
      } else {
        alert('Failed to save image')
      }
    } catch (error) {
      console.error('Error saving image:', error)
      alert('Failed to save image')
    }
  }

  const downloadImage = async () => {
    if (!selectedImage) {
      alert('Please select an image to download')
      return
    }

    try {
      const response = await fetch(selectedImage)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `thinking-image-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading image:', error)
      alert('Failed to download image')
    }
  }

  const extractThemeFromConversation = () => {
    if (!messages || messages.length === 0) return

    const conversationText = messages
      .map(msg => msg.content)
      .join(' ')
    
    // Simple theme extraction (first few words)
    const words = conversationText.split(' ').slice(0, 10).join(' ')
    setTheme(words)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-sky-100 to-sky-200 rounded-2xl flex items-center justify-center shadow-sm">
              <Image className="h-6 w-6 text-sky-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-sky-600">Thinking Image</h2>
              <p className="text-sm text-gray-600">Visualize your thoughts and ideas</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="bg-white border border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400 shadow-sm transition-all"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="p-8 overflow-y-auto max-h-[calc(95vh-200px)]">
          <div className="space-y-8">
            {/* Image Information */}
            <Card className="border-2 border-gray-100 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Image Information</CardTitle>
                <CardDescription>Set the title and theme for your thinking image</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="My Learning Visualization"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Theme or Keywords
                  </label>
                  <Input
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    placeholder="learning, growth, knowledge, development"
                    className="w-full"
                  />
                </div>
                {messages && messages.length > 0 && (
                  <Button
                    onClick={extractThemeFromConversation}
                    variant="outline"
                    size="sm"
                    className="text-sky-600 border-sky-300 hover:bg-sky-50"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Extract from Conversation
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Custom Prompt */}
            <Card className="border-2 border-gray-100 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Custom Prompt (Optional)</CardTitle>
                <CardDescription>Add specific instructions for image generation</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Describe the style, mood, or specific elements you want in the image..."
                  rows={3}
                  className="w-full"
                />
              </CardContent>
            </Card>

            {/* Generate Image */}
            <div className="flex justify-center">
              <Button
                onClick={generateImage}
                disabled={isGenerating || !theme.trim()}
                className="px-10 py-4 text-lg font-semibold bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white rounded-2xl shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                    Generating Image...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-3" />
                    Generate Thinking Image
                  </>
                )}
              </Button>
            </div>

            {/* Generated Images */}
            {generatedImages.length > 0 && (
              <Card className="border-2 border-gray-100 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Generated Images</CardTitle>
                      <CardDescription>Select an image to save or download</CardDescription>
                    </div>
                    <Button
                      onClick={regenerateImage}
                      disabled={isGenerating}
                      variant="outline"
                      size="sm"
                      className="text-sky-600 border-sky-300 hover:bg-sky-50"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Regenerate
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {generatedImages.map((imageUrl, index) => (
                      <div
                        key={index}
                        className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImage === imageUrl
                            ? 'border-sky-500 shadow-lg'
                            : 'border-gray-200 hover:border-sky-300'
                        }`}
                        onClick={() => setSelectedImage(imageUrl)}
                      >
                        <img
                          src={imageUrl}
                          alt={`Generated image ${index + 1}`}
                          className="w-full h-48 object-cover"
                        />
                        {selectedImage === imageUrl && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-sky-500 rounded-full flex items-center justify-center">
                            <div className="w-3 h-3 bg-white rounded-full"></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            {selectedImage && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <Button
                    onClick={saveImage}
                    className="bg-sky-600 hover:bg-sky-700 text-white"
                    disabled={!title.trim()}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save to Portfolio
                  </Button>
                </div>
                <Button
                  onClick={downloadImage}
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 