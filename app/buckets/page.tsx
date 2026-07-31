'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { supabase } from '@/lib/supabase'

interface Bucket {
  id: number
  name: string
  bucket_id: string
  endpoint: string
  key_id: string
  app_key: string
  total_size_gb: number
  used_size_gb: number
  owner_name: string
  is_active: boolean
}

export default function BucketsPage() {
  const [buckets, setBuckets] = useState<Bucket[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    bucket_id: '',
    endpoint: 's3.us-east-005.backblazeb2.com',
    key_id: '',
    app_key: '',
    total_size_gb: 10,
    owner_name: '',
  })

  useEffect(() => { fetchBuckets() }, [])

  const fetchBuckets = async () => {
    const { data } = await supabase.from('buckets').select('*').order('created_at')
    if (data) setBuckets(data)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await supabase.from('buckets').insert([{ ...form, used_size_gb: 0, is_active: true }])
    setForm({ name: '', bucket_id: '', endpoint: 's3.us-east-005.backblazeb2.com', key_id: '', app_key: '', total_size_gb: 10, owner_name: '' })
    setShowForm(false)
    fetchBuckets()
    setLoading(false)
  }

  const toggleActive = async (id: number, current: boolean) => {
    await supabase.from('buckets').update({ is_active: !current }).eq('id', id)
    fetchBuckets()
  }

  const deleteBucket = async (id: number) => {
    if (!confirm('Delete this bucket?')) return
    await supabase.from('buckets').delete().eq('id', id)
    fetchBuckets()
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">🪣 Buckets</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Add Bucket
          </button>
        </div>

        {/* Add Bucket Form */}
        {showForm && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Add New Bucket</h2>
            <form onSubmit={handleAdd} className="grid grid-cols-2 gap-4">
              {[
                { key: 'name', label: 'Bucket Display Name', placeholder: 'e.g. Friend 1 Bucket' },
                { key: 'owner_name', label: 'Owner Name', placeholder: 'e.g. Rahul' },
                { key: 'bucket_id', label: 'Bucket ID', placeholder: 'from Backblaze' },
                { key: 'endpoint', label: 'Endpoint', placeholder: 's3.us-east-005.backblazeb2.com' },
                { key: 'key_id', label: 'Key ID', placeholder: 'Application Key ID' },
                { key: 'app_key', label: 'Application Key', placeholder: 'Application Key' },
              ].map((field) => (
                <div key={field.key}>
                  <label className="text-sm text-gray-400 mb-1 block">{field.label}</label>
                  <input
                    value={(form as any)[field.key]}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
              ))}
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Total Size (GB)</label>
                <input
                  type="number"
                  value={form.total_size_gb}
                  onChange={(e) => setForm({ ...form, total_size_gb: Number(e.target.value) })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="col-span-2 flex gap-3">
                <button type="submit" disabled={loading}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                  {loading ? 'Adding...' : 'Add Bucket'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Buckets List */}
        <div className="space-y-4">
          {buckets.map((bucket) => {
            const percent = Math.min((bucket.used_size_gb / bucket.total_size_gb) * 100, 100)
            const barColor = percent > 80 ? 'bg-red-500' : percent > 60 ? 'bg-yellow-500' : 'bg-green-500'
            const freeGB = (bucket.total_size_gb - bucket.used_size_gb).toFixed(1)

            return (
              <div key={bucket.id} className={`bg-gray-900 border rounded-xl p-5 ${bucket.is_active ? 'border-gray-800' : 'border-gray-700 opacity-60'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold">{bucket.name}</span>
                      {bucket.is_active
                        ? <span className="text-xs bg-green-900 text-green-400 px-2 py-0.5 rounded-full">Active</span>
                        : <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">Inactive</span>
                      }
                    </div>
                    {bucket.owner_name && (
                      <div className="text-sm text-gray-400 mt-0.5">Owner: {bucket.owner_name}</div>
                    )}
                    <div className="text-xs text-gray-500 mt-1 font-mono">{bucket.bucket_id}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toggleActive(bucket.id, bucket.is_active)}
                      className="text-xs px-3 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300">
                      {bucket.is_active ? 'Disable' : 'Enable'}
                    </button>
                    <button onClick={() => deleteBucket(bucket.id)}
                      className="text-xs px-3 py-1 rounded-lg bg-red-900/30 hover:bg-red-900/50 text-red-400">
                      Delete
                    </button>
                  </div>
                </div>

                {/* Storage Bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Storage Used</span>
                    <span className="text-white">
                      {bucket.used_size_gb.toFixed(1)} GB / {bucket.total_size_gb} GB
                      <span className="text-green-400 ml-2">({freeGB} GB free)</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div className={`${barColor} h-3 rounded-full transition-all`}
                      style={{ width: `${percent}%` }} />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{percent.toFixed(1)}% used</div>
                </div>
              </div>
            )
          })}

          {buckets.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-3">🪣</div>
              <p>No buckets added yet</p>
              <p className="text-sm mt-1">Click "Add Bucket" to get started</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
