import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

async function getStats() {
  const [songs, users, buckets] = await Promise.all([
    supabase.from('songs').select('id', { count: 'exact' }),
    supabase.from('profiles').select('id', { count: 'exact' }),
    supabase.from('buckets').select('*').eq('is_active', true),
  ])

  const subscribedUsers = await supabase
    .from('profiles')
    .select('id', { count: 'exact' })
    .eq('is_subscribed', true)

  return {
    totalSongs: songs.count || 0,
    totalUsers: users.count || 0,
    totalBuckets: buckets.data?.length || 0,
    subscribedUsers: subscribedUsers.count || 0,
    buckets: buckets.data || [],
  }
}

export default async function DashboardPage() {
  const cookieStore = cookies()
  const auth = cookieStore.get('admin_auth')
  if (!auth) redirect('/')

  const stats = await getStats()

  const totalUsedGB = stats.buckets.reduce((sum: number, b: any) => sum + (b.used_size_gb || 0), 0)
  const totalGB = stats.buckets.reduce((sum: number, b: any) => sum + (b.total_size_gb || 0), 0)

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Songs', value: stats.totalSongs, icon: '🎵', color: 'purple' },
            { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: 'blue' },
            { label: 'Subscribers', value: stats.subscribedUsers, icon: '⭐', color: 'yellow' },
            { label: 'Active Buckets', value: stats.totalBuckets, icon: '🪣', color: 'green' },
          ].map((stat) => (
            <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Bucket Storage Overview */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">🪣 Storage Overview</h2>
          <div className="space-y-3">
            {stats.buckets.map((bucket: any) => {
              const percent = Math.min((bucket.used_size_gb / bucket.total_size_gb) * 100, 100)
              const color = percent > 80 ? 'bg-red-500' : percent > 60 ? 'bg-yellow-500' : 'bg-green-500'
              return (
                <div key={bucket.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white font-medium">{bucket.name}</span>
                    <span className="text-gray-400">
                      {bucket.used_size_gb.toFixed(1)} / {bucket.total_size_gb} GB
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`${color} h-2 rounded-full transition-all`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{percent.toFixed(1)}% used</div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between text-sm">
            <span className="text-gray-400">Total Storage</span>
            <span className="text-white font-semibold">{totalUsedGB.toFixed(1)} / {totalGB} GB used</span>
          </div>
        </div>
      </main>
    </div>
  )
}
