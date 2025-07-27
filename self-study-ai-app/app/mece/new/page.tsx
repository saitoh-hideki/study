'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import MECEModal from '@/components/mece-modal'

export default function MECENewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [initialTopic, setInitialTopic] = useState<string>('')

  useEffect(() => {
    const topic = searchParams.get('topic')
    if (topic) {
      setInitialTopic(decodeURIComponent(topic))
    }
  }, [searchParams])

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
        initialTheme={initialTopic}
      />
    </div>
  )
} 