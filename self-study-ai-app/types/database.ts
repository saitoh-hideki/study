export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string | null
          created_at: string
          language: string
          voice_type: string | null
          difficulty: string
        }
        Insert: {
          id: string
          email?: string | null
          created_at?: string
          language?: string
          voice_type?: string | null
          difficulty?: string
        }
        Update: {
          id?: string
          email?: string | null
          created_at?: string
          language?: string
          voice_type?: string | null
          difficulty?: string
        }
      }
      uploaded_files: {
        Row: {
          id: string
          user_id: string | null
          file_name: string
          file_path: string
          extracted_text: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          file_name: string
          file_path: string
          extracted_text?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          file_name?: string
          file_path?: string
          extracted_text?: string | null
          created_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          user_id: string
          file_id: string
          title: string
          started_at: string
          ended_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          file_id: string
          title: string
          started_at?: string
          ended_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          file_id?: string
          title?: string
          started_at?: string
          ended_at?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          session_id: string
          role: string
          message: string
          audio_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          role: string
          message: string
          audio_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          role?: string
          message?: string
          audio_url?: string | null
          created_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          message_id: string
          understood: boolean
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          message_id: string
          understood: boolean
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          understood?: boolean
          note?: string | null
          created_at?: string
        }
      }
      five_why_trees: {
        Row: {
          id: string
          created_at: string
          user_id: string | null
          conversation_id: string | null
          topic: string
          root_cause: string | null
          insights: Json | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id?: string | null
          conversation_id?: string | null
          topic: string
          root_cause?: string | null
          insights?: Json | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string | null
          conversation_id?: string | null
          topic?: string
          root_cause?: string | null
          insights?: Json | null
          metadata?: Json | null
        }
      }
      five_why_levels: {
        Row: {
          id: string
          created_at: string
          five_why_tree_id: string
          level_number: number
          question: string
          answer: string
          timestamp: string
        }
        Insert: {
          id?: string
          created_at?: string
          five_why_tree_id: string
          level_number: number
          question: string
          answer: string
          timestamp?: string
        }
        Update: {
          id?: string
          created_at?: string
          five_why_tree_id?: string
          level_number?: number
          question?: string
          answer?: string
          timestamp?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}