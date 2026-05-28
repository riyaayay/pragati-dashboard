'use client'
import { useState, useEffect } from 'react'

const STATUS_BADGE: Record<string, string> = {
  PENDING_SUPERVISOR: 'bg-yellow-100 text-yellow-700',
  PENDING_MANAGER:    'bg-blue-100 text-blue-700',
  APPROVED:           'bg-green-100 text-green-700',
  REJECTED:           'bg-red-100 text-red-700',
}

export default function ReviewQueue() {
  const [entries, setEntries]   = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [comment, setComment]   = useState<Record<string, string>>({})
  const [processing, setProcessing] = useState<string | null>(null)

  function load() {
    setLoading(true)
    fetch('/api/dpr?status=PENDING_SUPERVISOR')
      .then(r => r.json())
      .then(j => { setEntries(j.data || []); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  async function review(dprEntryId: string, action: 'APPROVE' | 'REJECT') {
    setProcessing(dprEntryId)
    await fetch('/api/dpr/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dprEntryId, action, comment: comment[dprEntryId] || '' }),
    })
    setProcessing(null)
    load()
  }

  const pending  = entries.filter(e => ['PENDING_SUPERVISOR','PENDING_MANAGER'].includes(e.approvalStatus))
  const reviewed = entries.filter(e => ['APPROVED','REJECTED'].includes(e.approvalStatus))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review Queue</h1>
          <p className="text-sm text-gray-400 mt-0.5">Pending DPR entries awaiting your approval</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-yellow-100 text-yellow-700 text-sm font-medium px-3 py-1.5 rounded-full">
            {pending.length} pending
          </span>
          <button onClick={load} className="text-sm text-brand-orange hover:underline">↻ Refresh</button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full" />
        </div>
      ) : pending.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-3">✅</div>
          <div className="text-gray-500 font-medium">All caught up! No pending reviews.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((entry: any) => (
            <div key={entry.id} className="bg-white rounded-xl border border-gray-200 p-5">
              {/* Machine + date header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-brand-orange font-medium">{entry.machine?.assetCode}</span>
                  <span className="text-gray-700">{entry.machine?.name}</span>
                  <span className="text-gray-400 text-sm">{entry.machine?.site?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{new Date(entry.date).toLocaleDateString('en-IN')}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[entry.approvalStatus]}`}>
                    {entry.approvalStatus.replace('_',' ')}
                  </span>
                </div>
              </div>

              {/* Key data grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-gray-400 text-xs mb-1">Hr / KM</div>
                  <div className="font-semibold">{entry.totalHrKm?.toFixed(1) ?? '—'}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-gray-400 text-xs mb-1">Diesel Consumed</div>
                  <div className="font-semibold">{entry.dieselConsumption} L</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-gray-400 text-xs mb-1">Avg (Actual / Std)</div>
                  <div className="font-semibold">
                    <span className={entry.actualAverage < entry.stdAverage * 0.8 ? 'text-red-500' : 'text-green-600'}>
                      {entry.actualAverage?.toFixed(2) ?? '—'}
                    </span>
                    <span className="text-gray-400"> / {entry.stdAverage ?? '—'}</span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-gray-400 text-xs mb-1">Work Done</div>
                  <div className="font-semibold">{entry.workdoneQty ?? '—'} {entry.workdoneUnit}</div>
                </div>
              </div>

              {entry.workdoneDetails && (
                <p className="text-sm text-gray-500 mb-4">{entry.workdoneDetails}</p>
              )}

              {/* Comment + actions */}
              <div className="flex gap-3 items-center">
                <input type="text"
                  placeholder="Add a comment (optional)..."
                  value={comment[entry.id] || ''}
                  onChange={e => setComment(c => ({ ...c, [entry.id]: e.target.value }))}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange" />
                <button
                  onClick={() => review(entry.id, 'APPROVE')}
                  disabled={processing === entry.id}
                  className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
                  ✓ Approve
                </button>
                <button
                  onClick={() => review(entry.id, 'REJECT')}
                  disabled={processing === entry.id}
                  className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
                  ✕ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
