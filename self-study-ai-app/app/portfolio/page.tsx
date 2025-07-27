'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  BookOpen, 
  Image, 
  Search, 
  Calendar, 
  Eye, 
  Download,
  Trash2,
  Plus,
  Filter
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Book {
  id: string
  title: string
  introduction: string
  chapters: Array<{
    id: string
    title: string
    content: string
  }>
  created_at: string
  updated_at: string
}

interface ThinkingImage {
  id: string
  title: string
  theme: string
  prompt: string
  image_url: string
  created_at: string
  updated_at: string
}

export default function PortfolioPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [thinkingImages, setThinkingImages] = useState<ThinkingImage[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'books' | 'images'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [selectedImage, setSelectedImage] = useState<ThinkingImage | null>(null)

  useEffect(() => {
    loadPortfolio()
  }, [])

  const loadPortfolio = async () => {
    const supabase = createClient()
    
    setIsLoading(true)
    try {
      // Load books
      const { data: booksData, error: booksError } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false })

      if (booksError) {
        console.error('Error loading books:', booksError)
        setBooks([])
      } else {
        setBooks(Array.isArray(booksData) ? booksData : [])
      }

      // Load thinking images
      const { data: imagesData, error: imagesError } = await supabase
        .from('thinking_images')
        .select('*')
        .order('created_at', { ascending: false })

      if (imagesError) {
        console.error('Error loading thinking images:', imagesError)
        setThinkingImages([])
      } else {
        setThinkingImages(Array.isArray(imagesData) ? imagesData : [])
      }
    } catch (error) {
      console.error('Error loading portfolio:', error)
      setBooks([])
      setThinkingImages([])
    } finally {
      setIsLoading(false)
    }
  }

  const deleteBook = async (bookId: string) => {
    const supabase = createClient()
    
    try {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', bookId)

      if (error) {
        console.error('Error deleting book:', error)
        alert('Failed to delete book')
      } else {
        setBooks(prevBooks => prevBooks.filter(book => book.id !== bookId))
      }
    } catch (error) {
      console.error('Error deleting book:', error)
      alert('Failed to delete book')
    }
  }

  const deleteThinkingImage = async (imageId: string) => {
    const supabase = createClient()
    
    try {
      const { error } = await supabase
        .from('thinking_images')
        .delete()
        .eq('id', imageId)

      if (error) {
        console.error('Error deleting thinking image:', error)
        alert('Failed to delete thinking image')
      } else {
        setThinkingImages(prevImages => prevImages.filter(img => img.id !== imageId))
      }
    } catch (error) {
      console.error('Error deleting thinking image:', error)
      alert('Failed to delete thinking image')
    }
  }

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.introduction.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredImages = thinkingImages.filter(img =>
    img.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    img.theme.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const showBookDetails = (book: Book) => {
    setSelectedBook(book)
  }

  const showImageDetails = (image: ThinkingImage) => {
    setSelectedImage(image)
  }

  const closeDetails = () => {
    setSelectedBook(null)
    setSelectedImage(null)
  }

  const downloadBook = (book: Book) => {
    const bookContent = `
# ${book.title}

${book.introduction}

${book.chapters.map((chapter, index) => `
## ${chapter.title}

${chapter.content}
`).join('\n')}
    `.trim()

    const blob = new Blob([bookContent], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${book.title}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-sky-100 to-sky-200 rounded-2xl flex items-center justify-center shadow-sm">
              <BookOpen className="h-6 w-6 text-sky-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-sky-600">Portfolio</h1>
              <p className="text-gray-600">Your creative works and thoughts</p>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search works..."
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterType === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterType('all')}
              size="sm"
            >
              All
            </Button>
            <Button
              variant={filterType === 'books' ? 'default' : 'outline'}
              onClick={() => setFilterType('books')}
              size="sm"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Books
            </Button>
            <Button
              variant={filterType === 'images' ? 'default' : 'outline'}
              onClick={() => setFilterType('images')}
              size="sm"
            >
              <Image className="h-4 w-4 mr-2" />
              Images
            </Button>
          </div>
        </div>

        {isLoading ? (
                      <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
        ) : (
          <div className="space-y-8">
            {/* Books Section */}
            {(filterType === 'all' || filterType === 'books') && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
                    <BookOpen className="h-6 w-6 text-sky-600" />
                    Created Books
                    <span className="text-sm font-normal text-gray-500">({filteredBooks.length})</span>
                  </h2>
                </div>
                
                {filteredBooks.length === 0 ? (
                  <Card className="text-center py-12">
                    <BookOpen className="h-16 w-16 text-sky-200 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No books yet</h3>
                    <p className="text-gray-600 mb-4">Create your first book with Book Builder</p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBooks.map((book) => (
                                            <Card key={book.id} className="group hover:shadow-lg transition-shadow duration-200">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg mb-2">{book.title}</CardTitle>
                              <CardDescription className="line-clamp-3">
                                {book.introduction}
                              </CardDescription>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteBook(book.id)}
                              className="opacity-0 group-hover:opacity-100 transition-all duration-200 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="h-4 w-4" />
                              {formatDate(book.created_at)}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <BookOpen className="h-4 w-4" />
                              {book.chapters.length} chapters
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1 rounded-lg"
                                onClick={() => showBookDetails(book)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Details
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1 rounded-lg"
                                onClick={() => downloadBook(book)}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Thinking Images Section */}
            {(filterType === 'all' || filterType === 'images') && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
                    <Image className="h-6 w-6 text-sky-600" />
                    Thinking Images
                    <span className="text-sm font-normal text-gray-500">({filteredImages.length})</span>
                  </h2>
                </div>
                
                {filteredImages.length === 0 ? (
                  <Card className="text-center py-12">
                    <Image className="h-16 w-16 text-sky-200 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No thinking images yet</h3>
                    <p className="text-gray-600 mb-4">Create your first image with Thinking Image</p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredImages.map((image) => (
                                            <Card key={image.id} className="group hover:shadow-lg transition-shadow duration-200">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg mb-2">{image.title}</CardTitle>
                              <CardDescription className="line-clamp-2">
                                {image.theme}
                              </CardDescription>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteThinkingImage(image.id)}
                              className="opacity-0 group-hover:opacity-100 transition-all duration-200 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {image.image_url && (
                              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                <img
                                  src={image.image_url}
                                  alt={image.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="h-4 w-4" />
                              {formatDate(image.created_at)}
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1 rounded-lg"
                                onClick={() => showImageDetails(image)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Details
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1 rounded-lg"
                                onClick={() => window.open(image.image_url, '_blank')}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Book Details Modal */}
        {selectedBook && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-100">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-sky-100 to-sky-200 rounded-xl flex items-center justify-center shadow-sm">
                    <BookOpen className="h-5 w-5 text-sky-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedBook.title}</h2>
                    <p className="text-sm text-gray-600">Created: {formatDate(selectedBook.created_at)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeDetails}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </Button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="space-y-6">
                  {selectedBook.introduction && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Introduction</h3>
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedBook.introduction}</p>
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Chapters ({selectedBook.chapters.length})</h3>
                    {selectedBook.chapters.length === 0 ? (
                      <p className="text-gray-500">No chapters yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {selectedBook.chapters.map((chapter, index) => (
                          <div key={chapter.id} className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-2">Chapter {index + 1}: {chapter.title}</h4>
                            <p className="text-gray-700 whitespace-pre-wrap">{chapter.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Image Details Modal */}
        {selectedImage && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-100">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl flex items-center justify-center shadow-sm">
                    <Image className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedImage.title}</h2>
                    <p className="text-sm text-gray-600">Created: {formatDate(selectedImage.created_at)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeDetails}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </Button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="space-y-6">
                  {selectedImage.image_url && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Image</h3>
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={selectedImage.image_url}
                          alt={selectedImage.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                  {selectedImage.theme && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Theme</h3>
                      <p className="text-gray-700">{selectedImage.theme}</p>
                    </div>
                  )}
                  {selectedImage.prompt && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Prompt</h3>
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedImage.prompt}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 