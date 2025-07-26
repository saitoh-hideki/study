'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MECEModal from '@/components/mece-modal'

export default function MECENewPage() {
  const router = useRouter()

  const handleClose = () => {
    router.push('/interview')
  }

  const handleSaveSuccess = () => {
    router.push('/mece')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white pt-20">
      <MECEModal 
        isOpen={true} 
        onClose={handleClose}
        onSaveSuccess={handleSaveSuccess}
      />
    </div>
  )
} 