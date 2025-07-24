import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface User {
  id: string
  email: string
  access: boolean
  is_admin: boolean
  created_at: string
}

export interface Subject {
  id: string
  name: string
  description?: string
  created_at: string
}

export interface Note {
  id: string
  subject_id: string
  title: string
  pdf_url: string
  created_at: string
  subjects?: Subject
}

export interface Video {
  id: string
  subject_id: string
  title: string
  youtube_url: string
  created_at: string
  subjects?: Subject
}