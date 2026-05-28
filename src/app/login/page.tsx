'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const router = useRouter()

  async function handleLogin() {
    setLoading(true)
    setError('')
    const res = await signIn('credentials', { email, password, redirect: false })
    if (res?.error) { setError('Invalid email or password'); setLoading(false) }
    else router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#1C1C1E] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Orange header */}
        <div className="bg-brand-orange px-8 py-6 text-white text-center">
          <div className="text-2xl font-bold">PRAGATI GROUP</div>
          <div className="text-orange-100 text-sm mt-1">Plant &amp; Machinery Dashboard</div>
        </div>
        <div className="px-8 py-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-5">Sign in to your account</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500 block mb-1">Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange" />
            </div>
            <div>
              <label className="text-sm text-gray-500 block mb-1">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange" />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button onClick={handleLogin} disabled={loading}
              className="w-full bg-brand-orange hover:bg-brand-orange-dark text-white py-3 rounded-lg font-semibold text-sm disabled:opacity-60 transition-colors">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
          <div className="mt-5 p-3 bg-orange-50 rounded-lg">
            <p className="text-xs text-gray-500 font-medium mb-1">Demo accounts:</p>
            <p className="text-xs text-gray-400">MD: md@pragati.in / MD@123</p>
            <p className="text-xs text-gray-400">DI: di.a@pragati.in / DI@1234</p>
            <p className="text-xs text-gray-400">Admin: admin@pragati.in / Admin@123</p>
          </div>
        </div>
      </div>
    </div>
  )
}
