'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Settings, Volume2, Globe, Target } from 'lucide-react'

interface User {
  id: string
  email: string | null
  created_at: string
  language: string
  voice_type: string | null
  difficulty: string
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState({
    language: 'ja',
    voice_type: 'Rachel',
    difficulty: 'normal'
  })
  const supabase = createClient()

  useEffect(() => {
    loadUserSettings()
  }, [])

  const loadUserSettings = async () => {
    setIsLoading(true)
    try {
      // TODO: Get current user ID from auth
      const userId = 'current-user-id'
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error loading user settings:', error)
        return
      }

      setUser(data)
      setSettings({
        language: data.language || 'ja',
        voice_type: data.voice_type || 'Rachel',
        difficulty: data.difficulty || 'normal'
      })
    } catch (error) {
      console.error('Error loading user settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateSettings = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({
          language: settings.language,
          voice_type: settings.voice_type,
          difficulty: settings.difficulty
        })
        .eq('id', user.id)

      if (error) {
        console.error('Error updating settings:', error)
        return
      }

      // Update local state
      setUser(prev => prev ? { ...prev, ...settings } : null)
    } catch (error) {
      console.error('Error updating settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container max-w-2xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            設定
          </CardTitle>
          <CardDescription>
            学習体験をカスタマイズするための設定を行えます
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Language Setting */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Globe className="h-4 w-4" />
              言語設定
            </label>
            <select
              value={settings.language}
              onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
              className="w-full px-3 py-2 border border-input rounded-md"
            >
              <option value="ja">日本語</option>
              <option value="en">English</option>
              <option value="zh">中文</option>
              <option value="ko">한국어</option>
            </select>
          </div>

          {/* Voice Type Setting */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Volume2 className="h-4 w-4" />
              音声タイプ
            </label>
            <select
              value={settings.voice_type}
              onChange={(e) => setSettings(prev => ({ ...prev, voice_type: e.target.value }))}
              className="w-full px-3 py-2 border border-input rounded-md"
            >
              <option value="Rachel">Rachel (女性)</option>
              <option value="John">John (男性)</option>
              <option value="Emma">Emma (若い女性)</option>
              <option value="David">David (若い男性)</option>
            </select>
          </div>

          {/* Difficulty Setting */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Target className="h-4 w-4" />
              難易度
            </label>
            <select
              value={settings.difficulty}
              onChange={(e) => setSettings(prev => ({ ...prev, difficulty: e.target.value }))}
              className="w-full px-3 py-2 border border-input rounded-md"
            >
              <option value="easy">初級</option>
              <option value="normal">中級</option>
              <option value="hard">上級</option>
            </select>
          </div>

          {/* Save Button */}
          <Button
            onClick={updateSettings}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? '保存中...' : '設定を保存'}
          </Button>
        </CardContent>
      </Card>

      {/* Current Settings Display */}
      {user && (
        <Card>
          <CardHeader>
            <CardTitle>現在の設定</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>言語:</span>
                <span>{settings.language === 'ja' ? '日本語' : settings.language}</span>
              </div>
              <div className="flex justify-between">
                <span>音声:</span>
                <span>{settings.voice_type}</span>
              </div>
              <div className="flex justify-between">
                <span>難易度:</span>
                <span>
                  {settings.difficulty === 'easy' ? '初級' :
                   settings.difficulty === 'normal' ? '中級' : '上級'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 