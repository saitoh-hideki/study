'use client'

import ThinkingImageModal from '@/components/thinking-image-modal'

export default function ThinkingImagePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
      <ThinkingImageModal isOpen={true} onClose={() => { window.location.href = '/portfolio' }} />
    </div>
  )
} 