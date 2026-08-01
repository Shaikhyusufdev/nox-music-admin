'use client'
import Sidebar from '@/components/Sidebar'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setUsers(data)
    setLoading(false)
  }

  const toggleSubscription = async (id: string, current: boolean) => {
    await supabase.from('profiles').update({ is_subscribed: !current }).eq('id', id)
    fetchUsers()
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold text-white mb-6">👥 Users</h1>
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400">
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Subscribed</th>
                <th className="text-left px-4 py-3">Joined</th>
                <th className="text-left px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500">No users yet</td></tr>
              ) : users.map((user) => (
                <tr key={user.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-3 text-white">{user.username || 'N/A'}</td>
                  <td className="px-4 py-3 text-gray-400">{user.email || 'N/A'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${user.is_subscribed ? 'bg-green-900 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                      {user.is_subscribed ? '✅ Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleSubscription(user.id, user.is_subscribed)}
                      className={`text-xs px-3 py-1 rounded-lg ${user.is_subscribed ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'}`}>
                      {user.is_subscribed ? 'Remove Sub' : 'Give Sub'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
