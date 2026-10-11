'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { supabase } from '@/lib/supabase'

const BACKEND_URL = 'https://noxmusic-backend-17et.onrender.com'
const CATEGORIES = ['trending', 'recent', 'sad', 'action', 'romantic', 'devotional', 'party']

interface Song {
  id: string
  title: string
  artist: string | null
  duration: string | null
  okru_id: string | null
  category: string | null
  thumbnail_url: string | null
  created_at: string
}

const emptyForm = {
  title: '',
  artist: '',
  duration: '',
  okru_link: '',
  category: 'recent',
  thumbnail_url: '',
}

// Poora OK.ru link ya sirf number, dono se ID nikalta hai
function extractOkruId(input: string): string | null {
  const t = input.trim()
  if (/^\d{6,20}$/.test(t)) return t
  const m = t.match(/(?:video|videoembed)\/(\d{6,20})/)
  return m ? m[1] : null
}

// Image ko 600px tak chhota karke JPEG banata hai (~60-100KB)
async function compressImage(file: File, maxSize = 600): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas support nahi hai')
  ctx.drawImage(bitmap, 0, 0, w, h)
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Compress nahi hua'))),
      'image/jpeg',
      0.85
    )
  )
}

export default function SongsPage() {
  const [songs, setSongs] = useState<Song[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [uploadingImg, setUploadingImg] = useState(false)

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImg(true)
    try {
      const blob = await compressImage(file)
      const fd = new FormData()
      fd.append('file', blob, 'cover.jpg')
      const res = await fetch('/api/upload-image', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || 'Upload fail')
      setForm((f) => ({ ...f, thumbnail_url: data.url }))
    } catch (err: any) {
      alert('Cover upload nahi hua: ' + err.message)
    }
    setUploadingImg(false)
    e.target.value = ''
  }

  useEffect(() => {
    fetchSongs()
  }, [])

  const fetchSongs = async () => {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      alert('Songs load nahi hue: ' + error.message)
      return
    }
    if (data) setSongs(data as Song[])
  }

  const openAdd = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (s: Song) => {
    setEditingId(s.id)
    setForm({
      title: s.title || '',
      artist: s.artist || '',
      duration: s.duration || '',
      okru_link: s.okru_id || '',
      category: s.category || 'recent',
      thumbnail_url: s.thumbnail_url || '',
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const okruId = extractOkruId(form.okru_link)
    if (!okruId) {
      alert('Sahi OK.ru link ya ID daalo (jaise https://ok.ru/video/16483057732299)')
      return
    }

    setSaving(true)
    const payload = {
      title: form.title.trim(),
      artist: form.artist.trim() || null,
      duration: form.duration.trim() || null,
      okru_id: okruId,
      category: form.category,
      thumbnail_url: form.thumbnail_url.trim() || null,
      is_active: true,
    }

    const { error } = editingId
      ? await supabase.from('songs').update(payload).eq('id', editingId)
      : await supabase.from('songs').insert(payload)

    setSaving(false)
    if (error) {
      alert('Save nahi hua: ' + error.message)
      return
    }
    closeForm()
    fetchSongs()
  }

  const changeCategory = async (id: string, category: string) => {
    const { error } = await supabase.from('songs').update({ category }).eq('id', id)
    if (error) alert('Category update nahi hui: ' + error.message)
    fetchSongs()
  }

  const deleteSong = async (id: string) => {
    if (!confirm('Delete this song?')) return
    const { error } = await supabase.from('songs').delete().eq('id', id)
    if (error) alert('Delete nahi hua: ' + error.message)
    fetchSongs()
  }

  const filtered = songs.filter(
    (s) =>
      s.title?.toLowerCase().includes(search.toLowerCase()) ||
      s.artist?.toLowerCase().includes(search.toLowerCase())
  )

  const inputCls =
    'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500'

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">🎵 Songs</h1>
          <button
            onClick={openAdd}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Add Song
          </button>
        </div>

        {/* Add / Edit Form */}
        {showForm && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              {editingId ? 'Edit Song' : 'Add New Song (OK.ru)'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Song Title *</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Tere Bin"
                    required
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Artist *</label>
                  <input
                    value={form.artist}
                    onChange={(e) => setForm({ ...form, artist: e.target.value })}
                    placeholder="e.g. Atif Aslam"
                    required
                    className={inputCls}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-gray-400 mb-1 block">OK.ru Video Link / ID *</label>
                  <input
                    value={form.okru_link}
                    onChange={(e) => setForm({ ...form, okru_link: e.target.value })}
                    placeholder="https://ok.ru/video/16483057732299"
                    required
                    className={inputCls}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Video OK.ru pe <b>computer se upload</b> hona chahiye (link se upload nahi) aur{' '}
                    <b>Public</b> hona chahiye.
                    {form.okru_link && (
                      <>
                        {' '}ID:{' '}
                        <span className="text-purple-400">
                          {extractOkruId(form.okru_link) || 'sahi nahi dikh raha'}
                        </span>
                      </>
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Duration</label>
                  <input
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    placeholder="e.g. 2:45"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className={inputCls}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-gray-400 mb-1 block">Cover Image (optional)</label>
                  <div className="flex items-center gap-3 mb-2">
                    {form.thumbnail_url && (
                      <img
                        src={form.thumbnail_url}
                        alt="cover"
                        className="w-16 h-16 rounded-lg object-cover border border-gray-700"
                      />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImagePick}
                      disabled={uploadingImg}
                      className="text-sm text-gray-400 file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white file:text-sm"
                    />
                    {uploadingImg && <span className="text-xs text-purple-400">Uploading...</span>}
                  </div>
                  <input
                    value={form.thumbnail_url}
                    onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
                    placeholder="ya URL yahan paste karo (khali chhodo to app khud dhundh legi)"
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving || uploadingImg}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingId ? 'Update Song' : 'Add Song'}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search */}
        <div className="mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Search songs or artists..."
            className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Songs Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400">
                <th className="text-left px-4 py-3">Song</th>
                <th className="text-left px-4 py-3">Artist</th>
                <th className="text-left px-4 py-3">Duration</th>
                <th className="text-left px-4 py-3">OK.ru ID</th>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((song) => (
                <tr key={song.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-3 text-white font-medium">{song.title}</td>
                  <td className="px-4 py-3 text-gray-400">{song.artist || '-'}</td>
                  <td className="px-4 py-3 text-gray-400">{song.duration || '-'}</td>
                  <td className="px-4 py-3">
                    {song.okru_id ? (
                      <span className="text-gray-400 text-xs">{song.okru_id}</span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-yellow-900/30 text-yellow-400">
                        ⚠ OK.ru nahi
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={song.category || ''}
                      onChange={(e) => changeCategory(song.id, e.target.value)}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-white text-xs"
                    >
                      <option value="">-</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {song.okru_id && (
                        <a
                          href={`${BACKEND_URL}/stream/${song.okru_id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs px-3 py-1 rounded-lg bg-green-900/30 hover:bg-green-900/50 text-green-400"
                        >
                          Test
                        </a>
                      )}
                      <button
                        onClick={() => openEdit(song)}
                        className="text-xs px-3 py-1 rounded-lg bg-blue-900/30 hover:bg-blue-900/50 text-blue-400"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteSong(song.id)}
                        className="text-xs px-3 py-1 rounded-lg bg-red-900/30 hover:bg-red-900/50 text-red-400"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    No songs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
