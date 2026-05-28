'use client'
import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'

type Machine = { id: string; assetCode: string; name: string; category: string; machineType: string }

export default function DprSubmitForm({ siteId, userName }: { siteId: string; userName: string }) {
  const [machines, setMachines] = useState<Machine[]>([])
  const [selected, setSelected] = useState<string>('')
  const [machine, setMachine]   = useState<Machine | null>(null)
  const [form, setForm]         = useState<Record<string, any>>({})
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)
  const [error, setError]       = useState('')
  const [todayDate]             = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetch('/api/machines').then(r => r.json()).then(j => setMachines(j.data || []))
  }, [])

  useEffect(() => {
    const m = machines.find(m => m.id === selected) || null
    setMachine(m)
    setForm({})
  }, [selected, machines])

  const set = (k: string, v: any) => setForm(f => {
    const updated = { ...f, [k]: v }
    // Auto-compute derived fields
    const start = parseFloat(updated.startingReading) || 0
    const close = parseFloat(updated.closingReading)  || 0
    const opBal = parseFloat(updated.dieselOpBal)     || 0
    const issued= parseFloat(updated.dieselIssued)    || 0
    const consn = parseFloat(updated.dieselConsumption) || 0
    const total = close - start
    updated.totalHrKm        = total > 0 ? total.toFixed(1) : ''
    updated.totalDiesel      = (opBal + issued).toFixed(1)
    updated.closingDieselBal = (opBal + issued - consn).toFixed(1)
    if (total > 0 && consn > 0) updated.actualAverage = (total / consn).toFixed(2)
    return updated
  })

  async function submit() {
    if (!selected) { setError('Please select a machine'); return }
    setLoading(true)
    setError('')
    const res  = await fetch('/api/dpr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, machineId: selected, date: todayDate }),
    })
    const json = await res.json()
    if (json.error) { setError(json.error); setLoading(false); return }
    setSuccess(true)
    setLoading(false)
  }

  if (success) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full shadow-lg">
        <div className="text-5xl mb-3">✅</div>
        <h2 className="text-xl font-bold text-gray-800">DPR Submitted!</h2>
        <p className="text-gray-400 text-sm mt-2 mb-6">Sent to supervisor for review.</p>
        <button onClick={() => { setSuccess(false); setSelected(''); setForm({}) }}
          className="w-full bg-brand-orange text-white py-3 rounded-xl font-semibold">
          Submit Another Machine
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Orange header */}
      <div className="bg-brand-orange text-white px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold">Pragati Group · DPR Entry</div>
            <div className="text-orange-100 text-xs">{userName} · {todayDate}</div>
          </div>
          <button onClick={() => signOut({ callbackUrl: `${window.location.origin}/login` })}
            className="text-orange-100 text-xs">Sign out</button>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-4 pb-8">
        {/* Machine selector */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <label className="text-sm font-medium text-gray-700 block mb-2">Select Machine *</label>
          <select value={selected} onChange={e => setSelected(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:ring-2 focus:ring-brand-orange focus:outline-none">
            <option value="">— Choose machine —</option>
            {machines.map(m => (
              <option key={m.id} value={m.id}>{m.assetCode} — {m.name}</option>
            ))}
          </select>
        </div>

        {machine && (
          <>
            {/* Machine info badge */}
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-sm">
              <span className="text-brand-orange font-medium">{machine.assetCode}</span>
              <span className="text-gray-500 ml-2">{machine.name}</span>
              <span className="ml-2 text-xs bg-orange-100 text-brand-orange px-2 py-0.5 rounded">
                {machine.machineType === 'VEHICLE' ? 'Vehicle (KM)' : 'Machine (Hrs)'}
              </span>
            </div>

            {/* Readings */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-medium text-gray-800 mb-3">
                {machine.machineType === 'VEHICLE' ? '📍 KM Readings' : '⏱ Hour Readings'}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400">Starting Reading</label>
                  <input type="number" value={form.startingReading || ''} onChange={e => set('startingReading', e.target.value)}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Closing Reading</label>
                  <input type="number" value={form.closingReading || ''} onChange={e => set('closingReading', e.target.value)}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm" />
                </div>
              </div>
              {form.totalHrKm && (
                <div className="mt-2 bg-green-50 rounded-lg px-3 py-2 text-sm">
                  Total {machine.machineType === 'VEHICLE' ? 'KM' : 'Hours'}: <strong>{form.totalHrKm}</strong>
                </div>
              )}
            </div>

            {/* Diesel */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-medium text-gray-800 mb-3">⛽ Diesel</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400">Opening Balance (L)</label>
                  <input type="number" value={form.dieselOpBal || ''} onChange={e => set('dieselOpBal', e.target.value)}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Diesel Issued (L)</label>
                  <input type="number" value={form.dieselIssued || ''} onChange={e => set('dieselIssued', e.target.value)}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Total Diesel (auto)</label>
                  <div className="mt-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-500">
                    {form.totalDiesel || '—'}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400">Diesel Consumed (L)</label>
                  <input type="number" value={form.dieselConsumption || ''} onChange={e => set('dieselConsumption', e.target.value)}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Closing Balance (auto)</label>
                  <div className="mt-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-500">
                    {form.closingDieselBal || '—'}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400">Std. Average</label>
                  <input type="number" value={form.stdAverage || ''} onChange={e => set('stdAverage', e.target.value)}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm" />
                </div>
              </div>
              {form.actualAverage && (
                <div className="mt-2 bg-blue-50 rounded-lg px-3 py-2 text-sm">
                  Actual Average: <strong>{form.actualAverage} {machine.machineType === 'VEHICLE' ? 'km/L' : 'hrs/L'}</strong>
                  {form.stdAverage && (
                    <span className={`ml-2 text-xs font-medium ${parseFloat(form.actualAverage) >= parseFloat(form.stdAverage) ? 'text-green-600' : 'text-red-500'}`}>
                      {parseFloat(form.actualAverage) >= parseFloat(form.stdAverage) ? '▲ Above std' : '▼ Below std'}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Work Done */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-medium text-gray-800 mb-3">🏗 Work Done</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400">Unit (m³, m², km, MT…)</label>
                    <input type="text" value={form.workdoneUnit || ''} onChange={e => set('workdoneUnit', e.target.value)}
                      placeholder="e.g. m³" className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Quantity</label>
                    <input type="number" value={form.workdoneQty || ''} onChange={e => set('workdoneQty', e.target.value)}
                      className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400">Work Details</label>
                  <input type="text" value={form.workdoneDetails || ''} onChange={e => set('workdoneDetails', e.target.value)}
                    placeholder="e.g. Earthwork excavation" className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Operator Name</label>
                  <input type="text" value={form.operatorName || ''} onChange={e => set('operatorName', e.target.value)}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Remarks</label>
                  <textarea value={form.remarks || ''} onChange={e => set('remarks', e.target.value)} rows={2}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm" />
                </div>
              </div>
            </div>

            {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">{error}</div>}

            <button onClick={submit} disabled={loading}
              className="w-full bg-brand-orange text-white py-4 rounded-xl font-bold text-base disabled:opacity-50 shadow-lg">
              {loading ? 'Submitting...' : '✓ Submit DPR for Review'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
