'use client'
import { useState, useEffect } from 'react'

const STATUS_STYLES: Record<string, string> = {
  OK:       'bg-green-100 text-green-700',
  DUE_SOON: 'bg-yellow-100 text-yellow-700',
  OVERDUE:  'bg-red-100 text-red-700',
  NO_DATA:  'bg-gray-100 text-gray-500',
}

export default function MaintenancePage() {
  const [data, setData]       = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/maintenance')
      .then(r => r.json())
      .then(j => { setData(j.data || []); setLoading(false) })
  }, [])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Periodical Maintenance</h1>
        <p className="text-sm text-gray-400 mt-0.5">Service schedule tracking — based on Periodical Maintenance Excel</p>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-4 gap-3">
        {(['OK','DUE_SOON','OVERDUE','NO_DATA'] as const).map(s => (
          <div key={s} className={`rounded-xl p-4 ${STATUS_STYLES[s]}`}>
            <div className="text-2xl font-bold">{data.filter(d => d.maintenanceStatus === s).length}</div>
            <div className="text-sm font-medium">{s.replace('_',' ')}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((machine: any) => (
            <div key={machine.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Machine header */}
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <span className="font-mono text-brand-orange font-medium text-sm">{machine.assetCode}</span>
                  <span className="text-gray-700 ml-2">{machine.name}</span>
                  <span className="text-gray-400 text-xs ml-2">— {machine.site?.name}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-500">
                    Current: <strong>{machine.currentReading?.toFixed(0)} {machine.machineType === 'VEHICLE' ? 'km' : 'hrs'}</strong>
                  </span>
                  {machine.hoursUntilNext !== null && (
                    <span className="text-gray-500">
                      Next service in: <strong className={machine.hoursUntilNext < 0 ? 'text-red-500' : machine.hoursUntilNext < 100 ? 'text-yellow-600' : 'text-green-600'}>
                        {machine.hoursUntilNext < 0 ? `${Math.abs(machine.hoursUntilNext).toFixed(0)} overdue` : `${machine.hoursUntilNext.toFixed(0)}`} {machine.machineType === 'VEHICLE' ? 'km' : 'hrs'}
                      </strong>
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[machine.maintenanceStatus]}`}>
                    {machine.maintenanceStatus.replace('_',' ')}
                  </span>
                </div>
              </div>

              {/* Service logs table */}
              {machine.maintenanceLogs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-orange-50">
                        {['#','Task','Std Hr/KM','Service Done At','Total Cost','Next Service At','Notes'].map(h => (
                          <th key={h} className="text-left px-4 py-2.5 text-gray-600 font-medium text-xs whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {machine.maintenanceLogs.map((log: any) => (
                        <tr key={log.id} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-2.5 font-medium text-brand-orange">{log.serviceNumber}</td>
                          <td className="px-4 py-2.5">{log.task}</td>
                          <td className="px-4 py-2.5">{log.standardHrKm?.toLocaleString() || '—'}</td>
                          <td className="px-4 py-2.5">{log.serviceCarriedHrKm?.toLocaleString() || '—'}</td>
                          <td className="px-4 py-2.5">{log.totalCost ? `₹${log.totalCost.toLocaleString()}` : '—'}</td>
                          <td className="px-4 py-2.5 font-medium">{log.nextServiceHrKm?.toLocaleString() || '—'}</td>
                          <td className="px-4 py-2.5 text-gray-400">{log.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-5 py-4 text-sm text-gray-400">No maintenance records yet</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
