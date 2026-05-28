'use client'
import { useState, useEffect, useCallback } from 'react'

type DprEntry = {
  id: string; date: string; approvalStatus: string
  machine: { assetCode: string; name: string; category: string; machineType: string; site: { name: string } }
  operatorName: string
  startingReading: number; closingReading: number; totalHrKm: number
  dieselOpBal: number; dieselIssued: number; totalDiesel: number
  dieselConsumption: number; closingDieselBal: number
  actualAverage: number; stdAverage: number
  workdoneUnit: string; workdoneQty: number; workdoneDetails: string; remarks: string
  submitter: { name: string }
  reviews: any[]
}

const STATUS_BADGE: Record<string, string> = {
  PENDING_SUPERVISOR: 'bg-yellow-100 text-yellow-700',
  PENDING_MANAGER:    'bg-blue-100 text-blue-700',
  APPROVED:           'bg-green-100 text-green-700',
  REJECTED:           'bg-red-100 text-red-700',
}

export default function DprReport() {
  const [entries, setEntries]   = useState<DprEntry[]>([])
  const [loading, setLoading]   = useState(true)
  const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 7*86400000).toISOString().split('T')[0])
  const [dateTo, setDateTo]     = useState(new Date().toISOString().split('T')[0])
  const [viewMode, setViewMode] = useState<'daily' | 'summary'>('daily')

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ dateFrom, dateTo })
    const res    = await fetch(`/api/dpr?${params}`)
    const json   = await res.json()
    setEntries(json.data || [])
    setLoading(false)
  }, [dateFrom, dateTo])

  useEffect(() => { load() }, [load])

  // Summary mode: aggregate by machine across date range
  const summaryData = entries.reduce((acc: Record<string, any>, e) => {
    const key = e.machine.assetCode
    if (!acc[key]) {
      acc[key] = {
        assetCode:           key,
        machineName:         e.machine.name,
        site:                e.machine.site.name,
        days:                0,
        totalHrKm:           0,
        totalDieselConsumed: 0,
        totalWorkdoneQty:    0,
        workdoneUnit:        e.workdoneUnit,
      }
    }
    acc[key].days                += 1
    acc[key].totalHrKm           += e.totalHrKm         || 0
    acc[key].totalDieselConsumed += e.dieselConsumption  || 0
    acc[key].totalWorkdoneQty    += e.workdoneQty        || 0
    return acc
  }, {})

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daily Progress Report</h1>
          <p className="text-sm text-gray-400 mt-0.5">Sitewise DPR — Starting/Closing Reading, Diesel, Work Done</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-gray-400 block mb-1">From Date</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">To Date</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div className="flex gap-2 ml-auto">
          <button onClick={() => setViewMode('daily')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${viewMode === 'daily' ? 'bg-brand-orange text-white' : 'bg-gray-100 text-gray-600'}`}>
            Daily View
          </button>
          <button onClick={() => setViewMode('summary')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${viewMode === 'summary' ? 'bg-brand-orange text-white' : 'bg-gray-100 text-gray-600'}`}>
            Summary (Aggregated)
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full" />
        </div>
      ) : viewMode === 'summary' ? (
        /* SUMMARY TABLE — one row per machine, all values summed */
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 text-sm font-medium text-gray-500">
            Summary: {dateFrom} to {dateTo} — {Object.keys(summaryData).length} machines
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-orange-50">
                <tr>
                  {['Asset Code','Machine Name','Site','Days','Total Hr/KM','Total Diesel (L)','Total Work Done'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-gray-600 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.values(summaryData).map((s: any) => (
                  <tr key={s.assetCode} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs font-medium text-brand-orange">{s.assetCode}</td>
                    <td className="px-4 py-3">{s.machineName}</td>
                    <td className="px-4 py-3 text-gray-500">{s.site}</td>
                    <td className="px-4 py-3">{s.days}</td>
                    <td className="px-4 py-3 font-medium">{s.totalHrKm.toFixed(1)}</td>
                    <td className="px-4 py-3 font-medium text-blue-600">{s.totalDieselConsumed.toFixed(1)} L</td>
                    <td className="px-4 py-3 font-medium">{s.totalWorkdoneQty.toFixed(1)} {s.workdoneUnit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* DAILY TABLE — exact Excel column structure */
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 text-sm font-medium text-gray-500">
            {entries.length} entries
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-orange-50">
                <tr>
                  {[
                    'Date','Asset Code','Category','Machine Name','Reg No','Location','Operator',
                    'Start Rdg','Close Rdg','Total Hr/KM',
                    'Diesel Op.Bal','Diesel Issued','Total Diesel','Diesel Consn.','Closing Bal',
                    'Actual Avg','Std Avg',
                    'Work Unit','Work Qty','Work Details','Remarks','Status'
                  ].map(h => (
                    <th key={h} className="text-left px-3 py-3 text-gray-600 font-medium whitespace-nowrap border-r border-gray-100 last:border-0">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2.5 whitespace-nowrap">{new Date(e.date).toLocaleDateString('en-IN')}</td>
                    <td className="px-3 py-2.5 font-mono text-brand-orange font-medium">{e.machine.assetCode}</td>
                    <td className="px-3 py-2.5 text-gray-500">{e.machine.category}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{e.machine.name}</td>
                    <td className="px-3 py-2.5 text-gray-400">{e.machine.assetCode}</td>
                    <td className="px-3 py-2.5">{e.machine.site.name}</td>
                    <td className="px-3 py-2.5">{e.operatorName || '—'}</td>
                    <td className="px-3 py-2.5 text-right">{e.startingReading ?? '—'}</td>
                    <td className="px-3 py-2.5 text-right">{e.closingReading  ?? '—'}</td>
                    <td className="px-3 py-2.5 text-right font-medium">{e.totalHrKm?.toFixed(1) ?? '—'}</td>
                    <td className="px-3 py-2.5 text-right">{e.dieselOpBal}</td>
                    <td className="px-3 py-2.5 text-right">{e.dieselIssued}</td>
                    <td className="px-3 py-2.5 text-right">{e.totalDiesel}</td>
                    <td className="px-3 py-2.5 text-right text-red-500">{e.dieselConsumption}</td>
                    <td className="px-3 py-2.5 text-right">{e.closingDieselBal}</td>
                    <td className="px-3 py-2.5 text-right">{e.actualAverage?.toFixed(2) ?? '—'}</td>
                    <td className="px-3 py-2.5 text-right text-gray-400">{e.stdAverage ?? '—'}</td>
                    <td className="px-3 py-2.5">{e.workdoneUnit || '—'}</td>
                    <td className="px-3 py-2.5 text-right">{e.workdoneQty ?? '—'}</td>
                    <td className="px-3 py-2.5">{e.workdoneDetails || '—'}</td>
                    <td className="px-3 py-2.5 text-gray-400">{e.remarks || '—'}</td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[e.approvalStatus]}`}>
                        {e.approvalStatus.replace('_',' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
