'use client'
import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

type DashData = {
  overview: { totalMachines: number; runningCount: number; breakdownCount: number; idleCount: number; availability: number; todayDprCount: number; pendingReviews: number }
  alerts:   any[]
  siteSummary: any[]
}

const COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#6b7280']

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className={`bg-white rounded-xl border-l-4 p-5 shadow-sm ${color}`}>
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  )
}

export default function ExecutiveDashboard() {
  const [data, setData]       = useState<DashData | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    const res  = await fetch('/api/dashboard')
    const json = await res.json()
    setData(json)
    setLoading(false)
  }

  useEffect(() => {
    load()
    // Auto-refresh every 60 seconds (real-time updates)
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full" />
    </div>
  )
  if (!data) return null

  const { overview, alerts, siteSummary } = data

  const pieData = [
    { name: 'Running',   value: overview.runningCount   },
    { name: 'Breakdown', value: overview.breakdownCount },
    { name: 'Idle',      value: overview.idleCount      },
  ]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Executive Overview</h1>
          <p className="text-gray-400 text-sm mt-0.5">Plant &amp; Machinery — All Sites</p>
        </div>
        <button onClick={load} className="text-sm text-brand-orange hover:underline">↻ Refresh</button>
      </div>

      {/* KPI Cards — matches Excel Dashboard row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Machinery"  value={overview.totalMachines}  color="border-gray-400"  />
        <StatCard label="Running"          value={overview.runningCount}   color="border-green-500" sub="Active today" />
        <StatCard label="Break-Down"       value={overview.breakdownCount} color="border-red-500"   sub="Need attention" />
        <StatCard label="Idle"             value={overview.idleCount}      color="border-yellow-500"/>
      </div>

      {/* Availability % — big highlight */}
      <div className="bg-white rounded-xl p-5 shadow-sm flex items-center gap-6">
        <div>
          <div className="text-sm text-gray-500">Machinery Availability</div>
          <div className="text-5xl font-bold text-brand-orange">{overview.availability}%</div>
        </div>
        <div className="flex-1">
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-4 bg-brand-orange rounded-full transition-all"
              style={{ width: `${overview.availability}%` }} />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0%</span><span>Target: 90%</span><span>100%</span>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          <div>DPR today: <strong>{overview.todayDprCount}</strong></div>
          <div>Pending reviews: <strong className="text-yellow-600">{overview.pendingReviews}</strong></div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Site-wise bar chart */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">Site-wise Machinery Status</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={siteSummary} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="code" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="running"   fill="#22c55e" name="Running"   />
              <Bar dataKey="breakdown" fill="#ef4444" name="Breakdown" />
              <Bar dataKey="idle"      fill="#f59e0b" name="Idle"      />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">Fleet Status Distribution</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Compliance Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-3">
            ⚠ Compliance Alerts
            <span className="ml-2 bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">{alerts.length}</span>
          </h2>
          <div className="space-y-2">
            {alerts.slice(0, 8).map((a: any) => (
              <div key={a.id} className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-sm ${a.status === 'EXPIRED' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                <div>
                  <span className="font-medium">{a.machine?.assetCode}</span>
                  <span className="text-gray-500 ml-2">{a.machine?.name}</span>
                  <span className="text-gray-400 ml-2">— {a.type.replace('_',' ')}</span>
                </div>
                <div className={`font-semibold text-xs ${a.status === 'EXPIRED' ? 'text-red-600' : 'text-yellow-600'}`}>
                  {a.status === 'EXPIRED' ? 'EXPIRED' : `Expires: ${new Date(a.expiryDate).toLocaleDateString('en-IN')}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Site summary table — exact match to Excel dashboard */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Site-wise Summary</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Site','Total','Running','Break-Down','Idle','Availability %','DPR Today'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {siteSummary.map((s: any) => (
              <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3">{s.total}</td>
                <td className="px-4 py-3 text-green-600 font-medium">{s.running}</td>
                <td className="px-4 py-3 text-red-500 font-medium">{s.breakdown}</td>
                <td className="px-4 py-3 text-yellow-600 font-medium">{s.idle}</td>
                <td className="px-4 py-3">
                  <span className={`font-bold ${s.total > 0 && (s.running/s.total*100) >= 80 ? 'text-green-600' : 'text-red-500'}`}>
                    {s.total > 0 ? ((s.running / s.total) * 100).toFixed(1) : '0.0'}%
                  </span>
                </td>
                <td className="px-4 py-3">{s.dprToday} / {s.running}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
