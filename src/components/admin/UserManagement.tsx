import React, { useEffect, useState } from 'react'
import { supabase, User } from '../../lib/supabase'
import { Check, X, Clock, Shield } from 'lucide-react'

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleUserAccess = async (userId: string, currentAccess: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ access: !currentAccess })
        .eq('id', userId)

      if (error) throw error
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, access: !currentAccess } : user
      ))
    } catch (error) {
      console.error('Error updating user access:', error)
    }
  }

  const toggleAdminStatus = async (userId: string, currentAdmin: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_admin: !currentAdmin })
        .eq('id', userId)

      if (error) throw error
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_admin: !currentAdmin } : user
      ))
    } catch (error) {
      console.error('Error updating admin status:', error)
    }
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
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
        <p className="text-sm text-gray-600">Manage user access and permissions</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.access 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user.access ? (
                      <>
                        <Check className="w-3 h-3 mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </>
                    )}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.is_admin 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.is_admin ? (
                      <>
                        <Shield className="w-3 h-3 mr-1" />
                        Admin
                      </>
                    ) : (
                      'User'
                    )}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                  <button
                    onClick={() => toggleUserAccess(user.id, user.access)}
                    className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      user.access
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {user.access ? (
                      <>
                        <X className="w-4 h-4 mr-1" />
                        Revoke Access
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Grant Access
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => toggleAdminStatus(user.id, user.is_admin)}
                    className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      user.is_admin
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    <Shield className="w-4 h-4 mr-1" />
                    {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No users found</p>
        </div>
      )}
    </div>
  )
}