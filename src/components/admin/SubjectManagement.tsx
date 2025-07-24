import React, { useEffect, useState } from 'react'
import { supabase, Subject } from '../../lib/supabase'
import { Plus, EditIcon, Trash2, Save, X } from 'lucide-react'

interface EditingSubject {
  id?: string
  name: string
  description?: string
}

export function SubjectManagement() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSubject, setEditingSubject] = useState<EditingSubject | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    fetchSubjects()
  }, [])

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('name')

      if (error) throw error
      setSubjects(data || [])
    } catch (error) {
      console.error('Error fetching subjects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!editingSubject || !editingSubject.name.trim()) return

    try {
      if (editingSubject.id) {
        // Update existing subject
        const { error } = await supabase
          .from('subjects')
          .update({
            name: editingSubject.name.trim(),
            description: editingSubject.description?.trim() || null
          })
          .eq('id', editingSubject.id)

        if (error) throw error

        setSubjects(subjects.map(subject =>
          subject.id === editingSubject.id
            ? { ...subject, name: editingSubject.name, description: editingSubject.description }
            : subject
        ))
      } else {
        // Create new subject
        const { data, error } = await supabase
          .from('subjects')
          .insert({
            name: editingSubject.name.trim(),
            description: editingSubject.description?.trim() || null
          })
          .select()
          .single()

        if (error) throw error
        setSubjects([...subjects, data])
      }

      setEditingSubject(null)
      setIsAdding(false)
    } catch (error) {
      console.error('Error saving subject:', error)
    }
  }

  const handleDelete = async (subjectId: string) => {
    if (!confirm('Are you sure? This will also delete all associated notes and videos.')) return

    try {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', subjectId)

      if (error) throw error
      setSubjects(subjects.filter(subject => subject.id !== subjectId))
    } catch (error) {
      console.error('Error deleting subject:', error)
    }
  }

  const startEditing = (subject: Subject) => {
    setEditingSubject({
      id: subject.id,
      name: subject.name,
      description: subject.description || ''
    })
    setIsAdding(false)
  }

  const startAdding = () => {
    setEditingSubject({ name: '', description: '' })
    setIsAdding(true)
  }

  const cancelEditing = () => {
    setEditingSubject(null)
    setIsAdding(false)
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Subject Management</h2>
          <p className="text-sm text-gray-600">Manage educational subjects</p>
        </div>
        <button
          onClick={startAdding}
          disabled={isAdding || editingSubject !== null}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Subject</span>
        </button>
      </div>

      <div className="space-y-4">
        {isAdding && editingSubject && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Name *
                </label>
                <input
                  type="text"
                  value={editingSubject.name}
                  onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter subject name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editingSubject.description || ''}
                  onChange={(e) => setEditingSubject({ ...editingSubject, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Enter subject description"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  disabled={!editingSubject.name.trim()}
                  className="flex items-center space-x-1 bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </button>
                <button
                  onClick={cancelEditing}
                  className="flex items-center space-x-1 bg-gray-600 text-white px-3 py-1 rounded-md hover:bg-gray-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {subjects.map((subject) => (
          <div key={subject.id} className="bg-white border border-gray-200 rounded-lg p-4">
            {editingSubject?.id === subject.id ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    value={editingSubject.name}
                    onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editingSubject.description || ''}
                    onChange={(e) => setEditingSubject({ ...editingSubject, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    disabled={!editingSubject.name.trim()}
                    className="flex items-center space-x-1 bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="flex items-center space-x-1 bg-gray-600 text-white px-3 py-1 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{subject.name}</h3>
                  {subject.description && (
                    <p className="text-gray-600 mt-1">{subject.description}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    Created: {new Date(subject.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => startEditing(subject)}
                    disabled={editingSubject !== null || isAdding}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <EditIcon className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(subject.id)}
                    disabled={editingSubject !== null || isAdding}
                    className="flex items-center space-x-1 text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {subjects.length === 0 && !isAdding && (
        <div className="text-center py-8">
          <p className="text-gray-500">No subjects found. Add your first subject to get started.</p>
        </div>
      )}
    </div>
  )
}