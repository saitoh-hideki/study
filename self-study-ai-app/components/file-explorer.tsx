'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  FileText, 
  Plus, 
  FolderOpen, 
  Trash2, 
  Edit3, 
  Save,
  X,
  MoreVertical,
  CheckSquare,
  Square,
  Loader2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface StudyFile {
  id: string
  name: string
  file_name: string
  extracted_text: string
  created_at: string
  user_id: string | null
}

interface FileExplorerProps {
  onFileSelect: (file: StudyFile) => void
  selectedFileId?: string
}

export default function FileExplorer({ onFileSelect, selectedFileId }: FileExplorerProps) {
  const [files, setFiles] = useState<StudyFile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNewFileForm, setShowNewFileForm] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [editingFileId, setEditingFileId] = useState<string | null>(null)
  const [editingFileName, setEditingFileName] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [isHoveringHeader, setIsHoveringHeader] = useState(false)
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadFiles()
  }, [])

  const loadFiles = async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      let query = supabase
        .from('uploaded_files')
        .select('*')
        .order('created_at', { ascending: false })

      if (user) {
        // Authenticated user - get their files
        query = query.eq('user_id', user.id)
      } else {
        // Anonymous user - get files with null user_id
        query = query.is('user_id', null)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error loading files:', error)
        return
      }

      // Transform data to StudyFile format and remove duplicates
      const studyFiles: StudyFile[] = data.map(file => ({
        id: file.id,
        name: file.file_name.replace(/\.[^/.]+$/, ''), // Remove file extension
        file_name: file.file_name,
        extracted_text: file.extracted_text || '',
        created_at: file.created_at,
        user_id: file.user_id
      }))

      // Remove duplicates based on file name (case insensitive)
      const uniqueFiles = studyFiles.filter((file, index, self) => 
        index === self.findIndex(f => 
          f.file_name.toLowerCase() === file.file_name.toLowerCase()
        )
      )

      setFiles(uniqueFiles)
    } catch (error) {
      console.error('Error loading files:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const createNewFile = async () => {
    if (!newFileName.trim()) return

    // Check if file with same name already exists
    const fileName = `${newFileName}.txt`
    const existingFile = files.find(file => 
      file.file_name.toLowerCase() === fileName.toLowerCase()
    )
    
    if (existingFile) {
      alert('同じ名前のファイルが既に存在します。別の名前を入力してください。')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const newFile = {
        file_name: fileName,
        file_path: `local://${fileName}`,
        extracted_text: `新しい学習ファイル: ${newFileName}\n\nここに学習内容を記録してください。`,
        user_id: user?.id || null
      }

      const { data, error } = await supabase
        .from('uploaded_files')
        .insert(newFile)
        .select()
        .single()

      if (error) {
        console.error('Error creating file:', error)
        return
      }

      const studyFile: StudyFile = {
        id: data.id,
        name: newFileName,
        file_name: data.file_name,
        extracted_text: data.extracted_text || '',
        created_at: data.created_at,
        user_id: data.user_id
      }

      setFiles(prev => [studyFile, ...prev])
      setNewFileName('')
      setShowNewFileForm(false)
      onFileSelect(studyFile)
    } catch (error) {
      console.error('Error creating file:', error)
    }
  }

  const updateFileName = async (fileId: string) => {
    if (!editingFileName.trim()) return

    const newFileName = `${editingFileName}.txt`
    
    // Check if file with same name already exists (excluding current file)
    const existingFile = files.find(file => 
      file.id !== fileId && 
      file.file_name.toLowerCase() === newFileName.toLowerCase()
    )
    
    if (existingFile) {
      alert('同じ名前のファイルが既に存在します。別の名前を入力してください。')
      return
    }

    try {
      const { error } = await supabase
        .from('uploaded_files')
        .update({ file_name: newFileName })
        .eq('id', fileId)

      if (error) {
        console.error('Error updating file name:', error)
        return
      }

      setFiles(prev => prev.map(file => 
        file.id === fileId 
          ? { ...file, name: editingFileName, file_name: newFileName }
          : file
      ))

      setEditingFileId(null)
      setEditingFileName('')
    } catch (error) {
      console.error('Error updating file name:', error)
    }
  }

  const deleteFile = async (fileId: string) => {
    if (!confirm('このファイルを削除しますか？')) return

    setDeletingFileId(fileId)
    try {
      const { error } = await supabase
        .from('uploaded_files')
        .delete()
        .eq('id', fileId)

      if (error) {
        console.error('Error deleting file:', error)
        return
      }

      setFiles(prev => prev.filter(file => file.id !== fileId))
    } catch (error) {
      console.error('Error deleting file:', error)
    } finally {
      setDeletingFileId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev)
      if (newSet.has(fileId)) {
        newSet.delete(fileId)
      } else {
        newSet.add(fileId)
      }
      return newSet
    })
  }

  const selectAllFiles = () => {
    setSelectedFiles(new Set(files.map(file => file.id)))
  }

  const deselectAllFiles = () => {
    setSelectedFiles(new Set())
  }

  const deleteSelectedFiles = async () => {
    if (selectedFiles.size === 0) return

    if (!window.confirm(`${selectedFiles.size}個のファイルを削除しますか？`)) {
      return
    }

    try {
      for (const fileId of selectedFiles) {
        const { error } = await supabase
          .from('uploaded_files')
          .delete()
          .eq('id', fileId)
        
        if (error) {
          console.error('Error deleting file:', error)
        }
      }

      // ファイルリストを更新
      setFiles(prev => prev.filter(file => !selectedFiles.has(file.id)))
      setSelectedFiles(new Set())
      setShowBulkActions(false)
    } catch (error) {
      console.error('Error deleting selected files:', error)
    }
  }

  return (
    <div className="w-72 bg-gray-50 border-r border-gray-200 h-full flex flex-col">
      <div className="p-6 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div 
          className="flex items-center justify-between mb-4 group"
          onMouseEnter={() => {
            setIsHoveringHeader(true)
            setShowBulkActions(true)
          }}
          onMouseLeave={() => {
            setIsHoveringHeader(false)
            setShowBulkActions(false)
          }}
        >
          <div className="flex items-center justify-between flex-1">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Learning Files
              </h2>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                <FolderOpen className="h-3 w-3 text-gray-400" />
                {files.length} files available
              </p>
            </div>
            {showBulkActions && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAllFiles}
                  className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200"
                  title="Select all"
                >
                  <CheckSquare className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={deselectAllFiles}
                  className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200"
                  title="Deselect all"
                >
                  <Square className="h-4 w-4" />
                </Button>
                {selectedFiles.size > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={deleteSelectedFiles}
                    className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                    title={`Delete ${selectedFiles.size} files`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNewFileForm(true)}
            className="h-9 w-9 p-0 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-all duration-200"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {showNewFileForm && (
          <div className="space-y-3 mt-3">
            <Input
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="ファイル名を入力"
              className="h-9 text-sm"
              onKeyPress={(e) => e.key === 'Enter' && createNewFile()}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={createNewFile}
                className="h-8 text-xs bg-sky-600 hover:bg-sky-700 text-white"
              >
                <Save className="h-3 w-3 mr-1" />
                作成
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowNewFileForm(false)
                  setNewFileName('')
                }}
                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-gray-500">
            読み込み中...
          </div>
        ) : files.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            ファイルがありません
          </div>
        ) : (
          <div className="p-2">
            {files.map((file) => (
              <div
                key={file.id}
                className={`group relative p-2 rounded-md cursor-pointer hover:bg-gray-100 transition-colors ${
                  selectedFileId === file.id ? 'bg-sky-50 border border-sky-200' : ''
                }`}
                onClick={() => onFileSelect(file)}
              >
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm font-medium truncate ${
                    selectedFileId === file.id ? 'text-sky-600' : 'text-gray-900'
                  }`}>
                    {editingFileId === file.id ? (
                      <Input
                        value={editingFileName}
                        onChange={(e) => setEditingFileName(e.target.value)}
                        className="h-6 text-sm"
                        onKeyPress={(e) => e.key === 'Enter' && updateFileName(file.id)}
                        onBlur={() => updateFileName(file.id)}
                        autoFocus
                      />
                    ) : (
                      file.name
                    )}
                  </h3>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-500">
                      {formatDate(file.created_at)}
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFileSelection(file.id)
                        }}
                        className={`transition-all duration-200 rounded-lg ${
                          selectedFiles.has(file.id)
                            ? 'bg-sky-100 text-sky-600 hover:bg-sky-200'
                            : 'opacity-0 group-hover:opacity-100 text-gray-400 hover:text-sky-600 hover:bg-sky-50'
                        }`}
                        title={selectedFiles.has(file.id) ? 'Deselect' : 'Select for deletion'}
                      >
                        {selectedFiles.has(file.id) ? (
                          <div className="w-3 h-3 bg-sky-600 rounded-sm"></div>
                        ) : (
                          <div className="w-3 h-3 border border-gray-400 rounded-sm"></div>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingFileId(file.id)
                          setEditingFileName(file.name)
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-all duration-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg"
                        title="Edit file name"
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteFile(file.id)
                        }}
                        disabled={deletingFileId === file.id}
                        className="opacity-0 group-hover:opacity-100 transition-all duration-200 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete file"
                      >
                        {deletingFileId === file.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <FileText className="h-3 w-3 text-sky-600" />
                    <span className="text-xs text-gray-600">
                      Study file
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 