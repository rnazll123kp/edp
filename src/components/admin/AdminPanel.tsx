import React, { useState } from 'react'
import { Users, BookOpen, FileText, Play } from 'lucide-react'
import { UserManagement } from './UserManagement'
import { SubjectManagement } from './SubjectManagement'
import { ContentManagement } from './ContentManagement'

type TabType = 'users' | 'subjects' | 'content'

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<TabType>('users')

  const tabs = [
    { id: 'users' as TabType, name: 'User Management', icon: Users },
    { id: 'subjects' as TabType, name: 'Subjects', icon: BookOpen },
    { id: 'content' as TabType, name: 'Content', icon: FileText },
  ]

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <div className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'subjects' && <SubjectManagement />}
        {activeTab === 'content' && <ContentManagement />}
      </div>
    </div>
  )
}