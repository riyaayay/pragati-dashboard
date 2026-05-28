import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as any
  const machineWhere: any = { isActive: true }
  if (!['MD', 'DGM', 'ADMIN'].includes(user.role)) {
    machineWhere.siteId = user.siteId
  }

  const machines = await prisma.machine.findMany({
    where: machineWhere,
    include: {
      maintenanceLogs: { orderBy: { serviceNumber: 'asc' } },
      site: true,
    },
  })

  // For each machine, find latest DPR reading to estimate days until next service
  const result = await Promise.all(machines.map(async m => {
    const latestDpr = await prisma.dprEntry.findFirst({
      where:   { machineId: m.id },
      orderBy: { date: 'desc' },
    })

    const latestMaint    = m.maintenanceLogs.slice(-1)[0]
    const currentReading = latestDpr?.closingReading || 0
    const hoursUntilNext = latestMaint?.nextServiceHrKm
      ? latestMaint.nextServiceHrKm - currentReading
      : null

    return {
      ...m,
      currentReading,
      hoursUntilNext,
      maintenanceStatus:
        hoursUntilNext === null    ? 'NO_DATA'  :
        hoursUntilNext < 0         ? 'OVERDUE'  :
        hoursUntilNext < 100       ? 'DUE_SOON' :
        'OK',
    }
  }))

  return NextResponse.json({ data: result })
}
