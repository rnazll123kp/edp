import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, Subject, Note, Video } from '../lib/supabase'
import { Clock, FileText, Play, Download, ExternalLink, AlertCircle } from 'lucide-react'

export function Dashboard() {
  const { user } = useAuth()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.access) {
      fetchContent()
    } else {
      setLoading(false)
    }
  }, [user])

  const fetchContent = async () => {
    try {
      const [subjectsResponse, notesResponse, videosResponse] = await Promise.all([
        supabase.from('subjects').select('*').order('name'),
        supabase.from('notes').select('*, subjects(name)').order('created_at', { ascending: false }),
        supabase.from('videos').select('*, subjects(name)').order('created_at', { ascending: false })
      ])

      if (subjectsResponse.data) setSubjects(subjectsResponse.data)
      if (notesResponse.data) setNotes(notesResponse.data)
      if (videosResponse.data) setVideos(videosResponse.data)
    } catch (error) {
      console.error('Error fetching content:', error)
    } finally {
      setLoading(false)
    }
  }

  const getYouTubeVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
    return match ? match[1] : null
  }

  const getSubjectContent = (subjectId: string) => {
    const subjectNotes = notes.filter(note => note.subject_id === subjectId)
    const subjectVideos = videos.filter(video => video.subject_id === subjectId)
    return { notes: subjectNotes, videos: subjectVideos }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user?.access) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Pending</h2>
        <p className="text-gray-600 mb-4">
          Your account is waiting for admin approval to access educational content.
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-sm text-yellow-800">
            Please contact your administrator to request access to the platform.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back!</h1>
        <p className="text-gray-600">Explore your educational content below</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Subjects Overview */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Subjects</h2>
          <div className="space-y-3">
            {subjects.map((subject) => {
              const content = getSubjectContent(subject.id)
              return (
                <div key={subject.id} className="bg-white rounded-lg p-4 shadow-sm border">
                  <h3 className="font-medium text-gray-900 mb-1">{subject.name}</h3>
                  {subject.description && (
                    <p className="text-sm text-gray-600 mb-2">{subject.description}</p>
                  )}
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center space-x-1">
                      <FileText className="w-3 h-3" />
                      <span>{content.notes.length} notes</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Play className="w-3 h-3" />
                      <span>{content.videos.length} videos</span>
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Content Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Notes */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Notes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notes.slice(0, 6).map((note) => (
                <div key={note.id} className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {note.subjects?.name}
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">{note.title}</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(note.created_at).toLocaleDateString()}</span>
                    </div>
                    <a
                      href={note.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Videos */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Videos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {videos.slice(0, 4).map((video) => {
                const videoId = getYouTubeVideoId(video.youtube_url)
                return (
                  <div key={video.id} className="bg-white rounded-lg overflow-hidden shadow-sm border hover:shadow-md transition-shadow">
                    {videoId && (
                      <div className="aspect-video bg-gray-100">
                        <img
                          src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {video.subjects?.name}
                        </span>
                      </div>
                      <h3 className="font-medium text-gray-900 mb-2">{video.title}</h3>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(video.created_at).toLocaleDateString()}</span>
                        </div>
                        <a
                          href={video.youtube_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Watch</span>
                        </a>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}