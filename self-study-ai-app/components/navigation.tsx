'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { FileUp, Mic, BookOpen, Settings } from 'lucide-react'

const navigation = [
  { name: 'アップロード', href: '/upload', icon: FileUp },
  { name: 'インタビュー', href: '/interview', icon: Mic },
  { name: 'レビュー', href: '/review', icon: BookOpen },
  { name: '設定', href: '/settings', icon: Settings },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="font-bold text-xl">
              自学自習AI
            </Link>
            <div className="hidden md:flex items-center gap-6">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary',
                      pathname === item.href
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}