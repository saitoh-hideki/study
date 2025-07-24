'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { FileUp, Mic, BookOpen, Settings, Sparkles } from 'lucide-react'

const navigation = [
  { name: 'アップロード', href: '/upload', icon: FileUp, description: '学習素材をアップロード' },
  { name: 'インタビュー', href: '/interview', icon: Mic, description: 'AIと対話学習' },
  { name: 'レビュー', href: '/review', icon: BookOpen, description: '学習記録を確認' },
  { name: '設定', href: '/settings', icon: Settings, description: 'アプリ設定' },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border/30">
      <div className="container mx-auto px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-12">
            <Link href="/" className="flex items-center gap-3 font-bold text-xl text-foreground hover:text-primary transition-colors">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold">Reflecta</span>
            </Link>
            <div className="hidden md:flex items-center gap-2">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'group relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg',
                      pathname === item.href
                        ? 'text-primary bg-primary/5 border border-primary/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none">
                      <div className="bg-foreground text-background text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
                        {item.description}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-foreground rotate-45"></div>
                      </div>
                    </div>
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