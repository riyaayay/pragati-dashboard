'use client'
import { useState, useEffect } from 'react'

const ROLES = ['ADMIN','MD','DGM','SITE_MANAGER','SUPERVISOR','DATA_INTERPRETER']

export default function AdminPanel() {
  const [users, setUsers]       = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState({ name: '', email: '', password: '', role: 'DATA_INTERPRETER', siteId: '' })
  const [sites, setSites]       = useState<any[]>([])
  const [error, setError]       = useState('')
  const [saving, setSaving]     = useState(false)

  function load() {
    setLoading(true)
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(j => { setUsers(j.data || []); setLoading(false) })
  }

  useEffect(() => {
    load()
    // Fetch sites for the dropdown
    fetch('/api/machines')
      .then(r => r.json())
      .then(j => {
        const uniqueSites = Array.from(
          new Map((j.data || []).map((m: any) => [m.site?.id, m.site])).values()
        ).filter(Boolean)
        setSites(uniqueSites as any[])
      })
  }, [])

  async function createUser() {
    setSaving(true)
    setError('')
    const res  = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, siteId: form.siteId || null }),
    })
    const json = await res.json()
    if (json.error) { setError(json.error); setSaving(false); return }
    setShowForm(false)
    setForm({ name: '', email: '', password: '', role: 'DATA_INTERPRETER', siteId: '' })
    load()
    setSaving(false)
  }

  const ROLE_BADGE: Record<string, string> = {
    ADMIN:            'bg-purple-100 text-purple-700',
    MD:               'bg-blue-100 text-blue-700',
    DGM:              'bg-indigo-100 text-indigo-700',
    SITE_MANAGER:     'bg-green-100 text-green-700',
    SUPERVISOR:       'bg-yellow-100 text-yellow-700',
    DATA_INTERPRETER: 'bg-orange-100 text-orange-700',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage users and system configuration</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="bg-brand-orange text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-orange-dark transition-colors">
          + Add User
        </button>
      </div>

      {/* Create user form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Create New User</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Full Name</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Password</label>
              <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Role</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange">
                {ROLES.map(r => <option key={r} value={r}>{r.replace('_',' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Site (leave blank for all-access)</label>
              <select value={form.siteId} onChange={e => setForm(f => ({ ...f, siteId: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange">
                <option value="">— All Sites —</option>
                {sites.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
          <div className="flex gap-3 mt-4">
            <button onClick={createUser} disabled={saving}
              className="bg-brand-orange text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
              {saving ? 'Creating...' : 'Create User'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="bg-gray-100 text-gray-600 px-5 py-2 rounded-lg text-sm font-medium">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Users table */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 text-sm font-medium text-gray-500">
            {users.length} users total
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Name','Email','Role','Site','Created'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${ROLE_BADGE[u.role] || ''}`}>
                      {u.role.replace('_',' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.site?.name || 'All Sites'}</td>
                  <td className="px-4 py-3 text-gray-400">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
