'use client'

import BookBuilderModal from '@/components/book-builder-modal'

export default function BookBuilderPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
      <BookBuilderModal isOpen={true} onClose={() => { window.location.href = '/portfolio' }} />
    </div>
  )
} 