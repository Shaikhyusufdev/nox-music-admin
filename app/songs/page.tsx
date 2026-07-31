'use client'
import { useEffect, useState, useRef } from 'react'
import Sidebar from '@/components/Sidebar'
import { supabase } from '@/lib/supabase'

interface Bucket { id: number; name: string; owner_name: string; is_active: boolean; used_size_gb: number; total_size_gb: number }
interface Song { id: number; title: string; artist: string; duration: string; plays: number; is_trending: boolean; audio_url: string; created_at: string }

export default function SongsPage() {
  const [songs, setSongs] = useState<Song[]>([])
  const [buckets, setBuckets] = useState<Bucket[]>([])
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [search, setSearch] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    title: '', artist: '', duration: '', bucket_id: '',
    is_trending: false,
  })

  useEffect(() => {
    fetchSongs()
    fetchBuckets()
  }, [])

  const fetchSongs = async () => {
    const { data } = await supabase.from('songs').select('*').order('created_at', { ascending: false })
    if (data) setSongs(data)
  }

  const fetchBuckets = async () => {
    const { data } = await supabase.from('buckets').select('*').eq('is_active', true)
    if (data) setBuckets(data)
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file || !form.bucket_id) return

    setUploading(true)
    setUploadProgress(0)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', form.title)
    formData.append('artist', form.artist)
    formData.append('duration', form.duration)
    formData.append('bucket_id', form.bucket_id)
    formData.append('is_trending', String(form.is_trending))

    try {
      const xhr = new XMLHttpRequest()
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100))
        }
      }
      xhr.onload = () => {
        if (xhr.status === 200) {
          setShowUpload(false)
          setForm({ title: '', artist: '', duration: '', bucket_id: '', is_trending: false })
          if (fileRef.current) fileRef.current.value = ''
          fetchSongs()
          fetchBuckets()
        }
        setUploading(false)
        setUploadProgress(0)
      }
      xhr.open('POST', '/api/upload')
      xhr.send(formData)
    } catch (err) {
      console.error(err)
      setUploading(false)
    }
  }

  const toggleTrending = async (id: number, current: boolean) => {
    await supabase.from('songs').update({ is_trending: !current }).eq('id', id)
    fetchSongs()
  }

  const deleteSong = async (id: number) => {
    if (!confirm('Delete this song?')) return
    await supabase.from('songs').delete().eq('id', id)
    fetchSongs()
  }

  const filtered = songs.filter(s =>
    s.title?.toLowerCase().includes(search.toLowerCase()) ||
    s.artist?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">🎵 Songs</h1>
          <button onClick={() => setShowUpload(!showUpload)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            + Upload Song
          </button>
        </div>

        {/* Upload Form */}
        {showUpload && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Upload New Song</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Song Title *</label>
                  <input value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                    placeholder="e.g. Tere Bin" required
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Artist *</label>
                  <input value={form.artist} onChange={e => setForm({...form, artist: e.target.value})}
                    placeholder="e.g. Atif Aslam" required
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Duration</label>
                  <input value={form.duration} onChange={e => setForm({...form, duration: e.target.value})}
                    placeholder="e.g. 4:32"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Select Bucket *</label>
                  <select value={form.bucket_id} onChange={e => setForm({...form, bucket_id: e.target.value})}
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500">
                    <option value="">-- Select Bucket --</option>
                    {buckets.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} {b.owner_name ? `(${b.owner_name})` : ''} — {b.used_size_gb.toFixed(1)}/{b.total_size_gb}GB
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">MP3 File *</label>
                <input ref={fileRef} type="file" accept=".mp3,audio/*" required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="trending" checked={form.is_trending}
                  onChange={e => setForm({...form, is_trending: e.target.checked})}
                  className="accent-purple-600" />
                <label htmlFor="trending" className="text-sm text-gray-400">Mark as Trending</label>
              </div>

              {/* Progress Bar */}
              {uploading && (
                <div>
                  <div className="flex justify-between text-sm text-gray-400 mb-1">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button type="submit" disabled={uploading}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                  {uploading ? `Uploading ${uploadProgress}%...` : 'Upload Song'}
                </button>
                <button type="button" onClick={() => setShowUpload(false)}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search */}
        <div className="mb-4">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Search songs or artists..."
            className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500" />
        </div>

        {/* Songs Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400">
                <th className="text-left px-4 py-3">Song</th>
                <th className="text-left px-4 py-3">Artist</th>
                <th className="text-left px-4 py-3">Duration</th>
                <th className="text-left px-4 py-3">Plays</th>
                <th className="text-left px-4 py-3">Trending</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((song) => (
                <tr key={song.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-3 text-white font-medium">{song.title}</td>
                  <td className="px-4 py-3 text-gray-400">{song.artist}</td>
                  <td className="px-4 py-3 text-gray-400">{song.duration || '-'}</td>
                  <td className="px-4 py-3 text-gray-400">{song.plays || 0}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleTrending(song.id, song.is_trending)}
                      className={`text-xs px-2 py-1 rounded-full ${song.is_trending ? 'bg-orange-900 text-orange-400' : 'bg-gray-800 text-gray-500'}`}>
                      {song.is_trending ? '🔥 Yes' : 'No'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteSong(song.id)}
                      className="text-xs px-3 py-1 rounded-lg bg-red-900/30 hover:bg-red-900/50 text-red-400">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">No songs found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
