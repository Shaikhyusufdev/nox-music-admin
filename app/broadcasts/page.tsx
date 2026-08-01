'use client'
import Sidebar from '@/components/Sidebar'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function BroadcastsPage() {
  const [form, setForm] = useState({ title: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const sendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    await supabase.from('broadcasts').insert([{
      title: form.title,
      message: form.message,
      sent_at: new Date().toISOString()
    }])
    setForm({ title: '', message: '' })
    setSent(true)
    setSending(false)
    setTimeout(() => setSent(false), 3000)
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold text-white mb-6">📢 Broadcasts</h1>
        <div className="max-w-xl bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Send Notification</h2>
          <form onSubmit={sendBroadcast} className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Title</label>
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                placeholder="e.g. New Songs Added!" required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500" />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Message</label>
              <textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})}
                placeholder="Write your message..." required rows={4}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500" />
            </div>
            {sent && <div className="text-green-400 text-sm">✅ Broadcast sent!</div>}
            <button type="submit" disabled={sending}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
              {sending ? 'Sending...' : '📢 Send Broadcast'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
