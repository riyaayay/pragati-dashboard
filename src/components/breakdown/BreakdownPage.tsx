'use client'
import { useState, useEffect } from 'react'

const STATUS_STYLES: Record<string, string> = {
  BREAKDOWN: 'bg-red-100 text-red-700 border-red-200',
  IDLE:      'bg-yellow-100 text-yellow-700 border-yellow-200',
  RUNNING:   'bg-green-100 text-green-700 border-green-200',
}

export default function BreakdownPage() {
  const [logs, setLogs]       = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [resolving, setResolving] = useState<string | null>(null)
  const [actionText, setActionText] = useState('')

  function load() {
    setLoading(true)
    fetch('/api/breakdown')
      .then(r => r.json())
      .then(j => { setLogs(j.data || []); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  async function markResolved(id: string) {
    await fetch('/api/breakdown', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, actionTaken: actionText }),
    })
    setResolving(null)
    setActionText('')
    load()
  }

  const active   = logs.filter(l => !l.resolvedAt)
  const resolved = logs.filter(l => l.resolvedAt)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Breakdown &amp; Idle Report</h1>
        <p className="text-sm text-gray-400 mt-0.5">Sitewise Breakdown-Idle Report — track defects and resolution</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-red-600">{active.filter(l => l.status === 'BREAKDOWN').length}</div>
          <div className="text-sm font-medium text-red-700">Active Breakdowns</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-yellow-600">{active.filter(l => l.status === 'IDLE').length}</div>
          <div className="text-sm font-medium text-yellow-700">Idle Machines</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-green-600">{resolved.length}</div>
          <div className="text-sm font-medium text-green-700">Resolved</div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          {/* Active breakdown/idle */}
          {active.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 bg-red-50 border-b border-red-100">
                <h2 className="font-semibold text-gray-800">Active Issues ({active.length})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Status','Asset Code','Machine','Site','Defect Nature','Action Taken','From Date','Target Date','Action'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {active.map(log => (
                      <tr key={log.id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${STATUS_STYLES[log.status]}`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-brand-orange font-medium text-xs">{log.machine?.assetCode}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{log.machine?.name}</td>
                        <td className="px-4 py-3 text-gray-500">{log.machine?.site?.name}</td>
                        <td className="px-4 py-3">{log.defectNature || '—'}</td>
                        <td className="px-4 py-3 text-gray-500">{log.actionTaken || '—'}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{log.defectFromDate ? new Date(log.defectFromDate).toLocaleDateString('en-IN') : '—'}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{log.targetRunDate ? new Date(log.targetRunDate).toLocaleDateString('en-IN') : '—'}</td>
                        <td className="px-4 py-3">
                          {resolving === log.id ? (
                            <div className="flex gap-2 min-w-[200px]">
                              <input type="text" placeholder="Action taken..." value={actionText} onChange={e => setActionText(e.target.value)}
                                className="border border-gray-300 rounded px-2 py-1 text-xs flex-1" />
                              <button onClick={() => markResolved(log.id)}
                                className="bg-green-500 text-white px-2 py-1 rounded text-xs">✓</button>
                              <button onClick={() => setResolving(null)}
                                className="bg-gray-300 text-gray-700 px-2 py-1 rounded text-xs">✕</button>
                            </div>
                          ) : (
                            <button onClick={() => setResolving(log.id)}
                              className="text-xs bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-100">
                              Mark Resolved
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Resolved */}
          {resolved.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 bg-green-50 border-b border-green-100">
                <h2 className="font-semibold text-gray-800">Resolved Issues ({resolved.length})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Asset Code','Machine','Site','Defect Nature','Action Taken','Resolved At'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {resolved.map(log => (
                      <tr key={log.id} className="border-t border-gray-100 hover:bg-gray-50 opacity-70">
                        <td className="px-4 py-3 font-mono text-brand-orange font-medium text-xs">{log.machine?.assetCode}</td>
                        <td className="px-4 py-3">{log.machine?.name}</td>
                        <td className="px-4 py-3 text-gray-500">{log.machine?.site?.name}</td>
                        <td className="px-4 py-3">{log.defectNature || '—'}</td>
                        <td className="px-4 py-3">{log.actionTaken || '—'}</td>
                        <td className="px-4 py-3 text-green-600">{new Date(log.resolvedAt).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {logs.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
              No breakdown or idle records found.
            </div>
          )}
        </>
      )}
    </div>
  )
}
