'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { FileUp, Mic, BookOpen, Settings, Sparkles, HelpCircle, Layers } from 'lucide-react'

const navigation = [
  { name: 'Upload', href: '/upload', icon: FileUp, description: 'Upload learning materials' },
  { name: 'Interview', href: '/interview', icon: Mic, description: 'AI-powered learning dialogue' },
  { name: 'Review', href: '/review', icon: BookOpen, description: 'View learning records' },
  { name: '5 Whys', href: '/five-why', icon: HelpCircle, description: '5 Whys analysis history' },
  { name: 'MECE', href: '/mece', icon: Layers, description: 'MECE analysis history' },
  { name: 'Settings', href: '/settings', icon: Settings, description: 'App settings' },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border/30">
      <div className="container mx-auto px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-12">
            <Link href="/" className="flex items-center gap-3 font-bold text-xl text-foreground hover:text-sky-600 transition-colors">
              <div className="w-8 h-8 bg-gradient-to-br from-sky-600 to-sky-700 rounded-lg flex items-center justify-center">
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
                        ? 'text-sky-600 bg-sky-50 border border-sky-200'
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