import React, { useEffect, useState } from 'react'
import { supabase, Subject, Note, Video } from '../../lib/supabase'
import { Plus, FileText, Play, Upload, Trash2, ExternalLink } from 'lucide-react'

export function ContentManagement() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubject, setSelectedSubject] = useState('')
  const [showAddNote, setShowAddNote] = useState(false)
  const [showAddVideo, setShowAddVideo] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)

  const [newNote, setNewNote] = useState({ title: '', file: null as File | null })
  const [newVideo, setNewVideo] = useState({ title: '', youtube_url: '' })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
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
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `pdfs/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('pdfs')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data } = supabase.storage
      .from('pdfs')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.title || !newNote.file || !selectedSubject) return

    setUploadingFile(true)
    try {
      const pdfUrl = await handleFileUpload(newNote.file)
      
      const { error } = await supabase
        .from('notes')
        .insert({
          subject_id: selectedSubject,
          title: newNote.title,
          pdf_url: pdfUrl
        })

      if (error) throw error

      setNewNote({ title: '', file: null })
      setShowAddNote(false)
      fetchData()
    } catch (error) {
      console.error('Error adding note:', error)
    } finally {
      setUploadingFile(false)
    }
  }

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newVideo.title || !newVideo.youtube_url || !selectedSubject) return

    try {
      const { error } = await supabase
        .from('videos')
        .insert({
          subject_id: selectedSubject,
          title: newVideo.title,
          youtube_url: newVideo.youtube_url
        })

      if (error) throw error

      setNewVideo({ title: '', youtube_url: '' })
      setShowAddVideo(false)
      fetchData()
    } catch (error) {
      console.error('Error adding video:', error)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)

      if (error) throw error
      setNotes(notes.filter(note => note.id !== noteId))
    } catch (error) {
      console.error('Error deleting note:', error)
    }
  }

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return

    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId)

      if (error) throw error
      setVideos(videos.filter(video => video.id !== videoId))
    } catch (error) {
      console.error('Error deleting video:', error)
    }
  }

  const filteredNotes = selectedSubject 
    ? notes.filter(note => note.subject_id === selectedSubject)
    : notes

  const filteredVideos = selectedSubject 
    ? videos.filter(video => video.subject_id === selectedSubject)
    : videos

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Content Management</h2>
          <p className="text-sm text-gray-600">Manage notes and videos for subjects</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAddNote(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Note</span>
          </button>
          <button
            onClick={() => setShowAddVideo(true)}
            className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Video</span>
          </button>
        </div>
      </div>

      {/* Subject Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Subject
        </label>
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Subjects</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
      </div>

      {/* Add Note Modal */}
      {showAddNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add New Note</h3>
            <form onSubmit={handleAddNote} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject *
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter note title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PDF File *
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setNewNote({ ...newNote, file: e.target.files?.[0] || null })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={uploadingFile}
                  className="flex items-center space-x-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>{uploadingFile ? 'Uploading...' : 'Upload'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddNote(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Video Modal */}
      {showAddVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add New Video</h3>
            <form onSubmit={handleAddVideo} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject *
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={newVideo.title}
                  onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter video title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  YouTube URL *
                </label>
                <input
                  type="url"
                  value={newVideo.youtube_url}
                  onChange={(e) => setNewVideo({ ...newVideo, youtube_url: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="flex items-center space-x-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Video</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddVideo(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Content Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notes */}
        <div>
          <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Notes ({filteredNotes.length})</span>
          </h3>
          <div className="space-y-3">
            {filteredNotes.map((note) => (
              <div key={note.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{note.title}</h4>
                    <p className="text-sm text-gray-600">{note.subjects?.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(note.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <a
                      href={note.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredNotes.length === 0 && (
              <p className="text-gray-500 text-center py-4">No notes found</p>
            )}
          </div>
        </div>

        {/* Videos */}
        <div>
          <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center space-x-2">
            <Play className="w-5 h-5" />
            <span>Videos ({filteredVideos.length})</span>
          </h3>
          <div className="space-y-3">
            {filteredVideos.map((video) => (
              <div key={video.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{video.title}</h4>
                    <p className="text-sm text-gray-600">{video.subjects?.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(video.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <a
                      href={video.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-600 hover:text-red-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleDeleteVideo(video.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredVideos.length === 0 && (
              <p className="text-gray-500 text-center py-4">No videos found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}