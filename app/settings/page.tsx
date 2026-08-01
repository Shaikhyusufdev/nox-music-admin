'use client'
import Sidebar from '@/components/Sidebar'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function SettingsPage() {
  const [settings, setSettings] = useState({ telegram_channel: '', maintenance_mode: false, welcome_message: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { fetchSettings() }, [])

  const fetchSettings = async () => {
    const { data } = await supabase.from('app_settings').select('*').single()
    if (data) setSettings(data)
  }

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await supabase.from('app_settings').upsert([settings])
    setSaved(true)
    setSaving(false)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold text-white mb-6">⚙️ Settings</h1>
        <div className="max-w-xl bg-gray-900 border border-gray-800 rounded-xl p-5">
          <form onSubmit={saveSettings} className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Telegram Channel Link</label>
              <input value={settings.telegram_channel}
                onChange={e => setSettings({...settings, telegram_channel: e.target.value})}
                placeholder="https://t.me/yourchannel"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500" />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Welcome Message</label>
              <textarea value={settings.welcome_message}
                onChange={e => setSettings({...settings, welcome_message: e.target.value})}
                placeholder="Welcome to NOX Music!" rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500" />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="maintenance"
                checked={settings.maintenance_mode}
                onChange={e => setSettings({...settings, maintenance_mode: e.target.checked})}
                className="accent-purple-600 w-4 h-4" />
              <label htmlFor="maintenance" className="text-sm text-gray-400">Maintenance Mode</label>
            </div>
            {saved && <div className="text-green-400 text-sm">✅ Settings saved!</div>}
            <button type="submit" disabled={saving}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
