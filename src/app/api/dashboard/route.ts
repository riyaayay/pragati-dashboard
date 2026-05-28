import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [totalMachines, breakdownLogs, todayDpr, expiringDocs, pendingReviews] = await Promise.all([
    prisma.machine.count({ where: { isActive: true } }),

    prisma.breakdownLog.findMany({
      where:   { resolvedAt: null },
      include: { machine: { include: { site: true } } },
    }),

    prisma.dprEntry.findMany({
      where: {
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt:  new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    }),

    prisma.complianceDoc.findMany({
      where:   { status: { in: ['EXPIRING_SOON', 'EXPIRED'] } },
      include: { machine: { include: { site: true } } },
      orderBy: { expiryDate: 'asc' },
    }),

    prisma.dprEntry.count({
      where: { approvalStatus: { in: ['PENDING_SUPERVISOR', 'PENDING_MANAGER'] } },
    }),
  ])

  const runningCount   = totalMachines - breakdownLogs.filter(l => l.status === 'BREAKDOWN').length - breakdownLogs.filter(l => l.status === 'IDLE').length
  const breakdownCount = breakdownLogs.filter(l => l.status === 'BREAKDOWN').length
  const idleCount      = breakdownLogs.filter(l => l.status === 'IDLE').length
  const availability   = totalMachines > 0
    ? ((runningCount / totalMachines) * 100).toFixed(2)
    : '0.00'

  // Site-wise summary
  const sites = await prisma.site.findMany({
    include: {
      machines: {
        include: {
          breakdownLogs: { where: { resolvedAt: null } },
          dprEntries:    {
            where: { date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
          },
        },
      },
    },
  })

  const siteSummary = sites.map(s => ({
    id:        s.id,
    name:      s.name,
    code:      s.code,
    total:     s.machines.length,
    running:   s.machines.filter(m => m.breakdownLogs.length === 0).length,
    breakdown: s.machines.filter(m => m.breakdownLogs.some(b => b.status === 'BREAKDOWN')).length,
    idle:      s.machines.filter(m => m.breakdownLogs.some(b => b.status === 'IDLE')).length,
    dprToday:  s.machines.filter(m => m.dprEntries.length > 0).length,
  }))

  return NextResponse.json({
    overview: {
      totalMachines,
      runningCount,
      breakdownCount,
      idleCount,
      availability: parseFloat(availability),
      todayDprCount: todayDpr.length,
      pendingReviews,
    },
    alerts:     expiringDocs,
    breakdowns: breakdownLogs,
    siteSummary,
  })
}
