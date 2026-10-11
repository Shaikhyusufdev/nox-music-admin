'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { supabase } from '@/lib/supabase'

interface Category {
  id: string
  name: string
  label: string | null
  sort_order: number | null
  created_at: string
}

// "Sad Songs" -> "sad-songs"  (songs.category me yahi slug save hota hai)
function makeSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

export default function CategoriesPage() {
  const [cats, setCats] = useState<Category[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [label, setLabel] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const { data: c, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
    if (error) {
      alert('Categories load nahi hui: ' + error.message)
      return
    }
    setCats((c || []) as Category[])

    const { data: s } = await supabase.from('songs').select('category')
    const map: Record<string, number> = {}
    for (const row of (s || []) as { category: string | null }[]) {
      if (row.category) map[row.category] = (map[row.category] || 0) + 1
    }
    setCounts(map)
  }

  useEffect(() => {
    load()
  }, [])

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    const slug = makeSlug(label)
    if (!slug) {
      alert('Sahi naam daalo (english letters / numbers)')
      return
    }
    if (cats.some((c) => c.name === slug)) {
      alert('Ye category pehle se hai')
      return
    }
    setSaving(true)
    const nextOrder = cats.length ? Math.max(...cats.map((c) => c.sort_order ?? 0)) + 1 : 1
    const { error } = await supabase
      .from('categories')
      .insert({ name: slug, label: label.trim(), sort_order: nextOrder })
    setSaving(false)
    if (error) {
      alert('Add nahi hui: ' + error.message)
      return
    }
    setLabel('')
    load()
  }

  const changeOrder = async (id: string, value: string) => {
    const n = parseInt(value, 10)
    if (Number.isNaN(n)) return
    const { error } = await supabase.from('categories').update({ sort_order: n }).eq('id', id)
    if (error) alert('Order update nahi hua: ' + error.message)
    load()
  }

  const deleteCategory = async (c: Category) => {
    const n = counts[c.name] || 0
    const name = c.label || c.name
    const msg =
      n > 0
        ? `"${name}" mein ${n} songs hain. Category delete hone par ye songs us section se hat jayenge. Phir bhi delete karein?`
        : `Delete "${name}"?`
    if (!confirm(msg)) return
    if (c.name === 'trending' && !confirm('Trending app ka main section hai. Pakka delete karna hai?')) return
    const { error } = await supabase.from('categories').delete().eq('id', c.id)
    if (error) alert('Delete nahi hui: ' + error.message)
    load()
  }

  const inputCls =
    'bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500'

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold text-white mb-6">🗂️ Categories</h1>

        {/* Add form */}
        <form
          onSubmit={addCategory}
          className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6 flex flex-wrap items-end gap-3"
        >
          <div className="flex-1 min-w-[220px]">
            <label className="text-sm text-gray-400 mb-1 block">New Category Name</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Workout"
              required
              className={inputCls + ' w-full'}
            />
            {label && (
              <p className="text-xs text-gray-500 mt-1">
                Slug: <span className="text-purple-400">{makeSlug(label) || 'sahi nahi dikh raha'}</span>
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'Adding...' : '+ Add Category'}
          </button>
        </form>

        {/* List */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400">
                <th className="text-left px-4 py-3">Order</th>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Slug</th>
                <th className="text-left px-4 py-3">Songs</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cats.map((c) => (
                <tr key={c.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      key={`${c.id}-${c.sort_order}`}
                      defaultValue={c.sort_order ?? 0}
                      onBlur={(e) => {
                        if (e.target.value !== String(c.sort_order ?? 0)) changeOrder(c.id, e.target.value)
                      }}
                      className="w-16 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-white text-xs"
                    />
                  </td>
                  <td className="px-4 py-3 text-white font-medium">{c.label || c.name}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{c.name}</td>
                  <td className="px-4 py-3 text-gray-400">{counts[c.name] || 0}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => deleteCategory(c)}
                      className="text-xs px-3 py-1 rounded-lg bg-red-900/30 hover:bg-red-900/50 text-red-400"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {cats.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    No categories found
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
