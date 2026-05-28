'use client'
import { useState, useEffect } from 'react'

const TYPES = ['INSURANCE','RTO_TAX','FITNESS','PERMIT','PUC'] as const
const TYPE_LABELS = { INSURANCE:'Insurance', RTO_TAX:'RTO Tax', FITNESS:'Fitness', PERMIT:'Permit', PUC:'PUC' }

export default function CompliancePage() {
  const [activeType, setActiveType] = useState<typeof TYPES[number]>('INSURANCE')
  const [docs, setDocs]     = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/compliance?type=${activeType}`)
      .then(r => r.json())
      .then(j => { setDocs(j.data || []); setLoading(false) })
  }, [activeType])

  const STATUS_STYLES = {
    VALID:         'bg-green-100 text-green-700',
    EXPIRING_SOON: 'bg-yellow-100 text-yellow-700',
    EXPIRED:       'bg-red-100 text-red-700',
    UNKNOWN:       'bg-gray-100 text-gray-500',
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Compliance Documents</h1>
      <p className="text-sm text-gray-400">Insurance · RTO Tax · Fitness · Permit · PUC — all document expiry tracking</p>

      {/* Tab switcher — matches Excel's 5 sheets */}
      <div className="flex gap-2 flex-wrap">
        {TYPES.map(t => (
          <button key={t} onClick={() => setActiveType(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeType === t ? 'bg-brand-orange text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-orange'}`}>
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Alert summary */}
      <div className="grid grid-cols-3 gap-3">
        {(['EXPIRED','EXPIRING_SOON','VALID'] as const).map(s => (
          <div key={s} className={`rounded-xl p-4 ${STATUS_STYLES[s]}`}>
            <div className="text-2xl font-bold">{docs.filter(d => d.statusComputed === s).length}</div>
            <div className="text-sm font-medium">{s.replace('_',' ')}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? <div className="text-center py-8 text-gray-400">Loading...</div> : (
        <div className="bg-white rounded-xl overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-orange-50">
                <tr>
                  {['Asset Code','Machine Name','Site','Renewed Date','Expiry Date','Amount','Days Left','Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-gray-600 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {docs.map(d => (
                  <tr key={d.id} className={`border-t border-gray-100 hover:bg-gray-50 ${d.statusComputed === 'EXPIRED' ? 'bg-red-50/30' : d.statusComputed === 'EXPIRING_SOON' ? 'bg-yellow-50/30' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs text-brand-orange font-medium">{d.machine?.assetCode}</td>
                    <td className="px-4 py-3">{d.machine?.name}</td>
                    <td className="px-4 py-3 text-gray-500">{d.machine?.site?.name}</td>
                    <td className="px-4 py-3">{d.renewedDate ? new Date(d.renewedDate).toLocaleDateString('en-IN') : '—'}</td>
                    <td className="px-4 py-3">{d.expiryDate  ? new Date(d.expiryDate).toLocaleDateString('en-IN')  : '—'}</td>
                    <td className="px-4 py-3">{d.amount ? `₹${d.amount.toLocaleString()}` : '—'}</td>
                    <td className="px-4 py-3">
                      {d.daysToExpiry !== null
                        ? <span className={`font-medium ${d.daysToExpiry < 0 ? 'text-red-500' : d.daysToExpiry < 30 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {d.daysToExpiry < 0 ? `${Math.abs(d.daysToExpiry)}d overdue` : `${d.daysToExpiry}d`}
                          </span>
                        : '—'
                      }
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[d.statusComputed as keyof typeof STATUS_STYLES] || ''}`}>
                        {d.statusComputed?.replace('_',' ')}
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
