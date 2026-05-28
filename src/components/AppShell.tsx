'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { getNavItems } from '@/lib/rbac'
import { Role } from '@prisma/client'

const ICONS: Record<string, string> = {
  grid:             '▦',
  upload:           '↑',
  'check-circle':   '✓',
  'file-text':      '≡',
  'alert-triangle': '⚠',
  tool:             '⚙',
  shield:           '🛡',
  settings:         '⚙',
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const user     = session?.user as any
  if (!user) return <>{children}</>

  const navItems = getNavItems(user.role as Role)

  const roleLabels: Record<string, string> = {
    ADMIN:            'Admin',
    MD:               'Managing Director',
    DGM:              'Deputy General Manager',
    SITE_MANAGER:     'Site Manager',
    SUPERVISOR:       'Supervisor',
    DATA_INTERPRETER: 'Data Interpreter',
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1C1C1E] text-white flex flex-col fixed h-full z-40">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-orange rounded-full flex items-center justify-center text-white font-bold text-sm">P</div>
            <div>
              <div className="font-semibold text-sm">Pragati Group</div>
              <div className="text-xs text-gray-400">Plant &amp; Machinery</div>
            </div>
          </div>
        </div>

        {/* User info */}
        <div className="px-5 py-3 border-b border-white/10">
          <div className="text-xs font-medium text-brand-orange">{roleLabels[user.role] || user.role}</div>
          <div className="text-sm text-white truncate">{user.name}</div>
          {user.siteName && <div className="text-xs text-gray-400">{user.siteName}</div>}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                pathname === item.href
                  ? 'bg-brand-orange text-white font-medium'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }`}>
              <span className="text-base w-5 text-center">{ICONS[item.icon] || '•'}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Sign out */}
        <div className="px-3 pb-4">
          <button onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full text-left px-3 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1 min-h-screen">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">{user.name}</span>
            <div className="w-8 h-8 bg-brand-orange rounded-full flex items-center justify-center text-white text-xs font-bold">
              {user.name?.[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
