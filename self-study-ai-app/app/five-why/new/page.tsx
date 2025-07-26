'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import FiveWhyModal from '@/components/five-why-modal'

export default function FiveWhyNewPage() {
  const router = useRouter()

  const handleClose = () => {
    router.push('/interview')
  }

  const handleSaveSuccess = () => {
    router.push('/five-why')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white pt-20">
      <FiveWhyModal 
        isOpen={true} 
        onClose={handleClose}
        onSaveSuccess={handleSaveSuccess}
      />
    </div>
  )
} 