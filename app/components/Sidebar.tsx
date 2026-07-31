'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const navItems = [
  { href: '/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/songs', icon: '🎵', label: 'Songs' },
  { href: '/buckets', icon: '🪣', label: 'Buckets' },
  { href: '/users', icon: '👥', label: 'Users' },
  { href: '/plans', icon: '💰', label: 'Plans' },
  { href: '/broadcasts', icon: '📢', label: 'Broadcasts' },
  { href: '/settings', icon: '⚙️', label: 'Settings' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' })
    router.push('/')
  }

  return (
    <aside className="w-56 bg-gray-900 border-r border-gray-800 min-h-screen flex flex-col">
      <div className="p-5 border-b border-gray-800">
        <div className="text-xl font-bold text-white">🎵 NOX Admin</div>
        <div className="text-xs text-gray-500 mt-1">Music Panel</div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
              pathname === item.href
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-900/20 transition"
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
