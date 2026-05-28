import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as any
  const { searchParams } = new URL(req.url)
  const type   = searchParams.get('type')
  const siteId = searchParams.get('siteId')

  const machineWhere: any = { isActive: true }
  if (!['MD', 'DGM', 'ADMIN'].includes(user.role)) {
    machineWhere.siteId = user.siteId
  } else if (siteId) {
    machineWhere.siteId = siteId
  }

  const docs = await prisma.complianceDoc.findMany({
    where: {
      ...(type ? { type: type as any } : {}),
      machine: machineWhere,
    },
    include: { machine: { include: { site: true } } },
    orderBy: { expiryDate: 'asc' },
  })

  // Auto-update status based on current date
  const today  = new Date()
  const result = docs.map(d => {
    const days = d.expiryDate
      ? Math.floor((d.expiryDate.getTime() - today.getTime()) / 86400000)
      : null
    return {
      ...d,
      daysToExpiry: days,
      statusComputed:
        days === null  ? 'UNKNOWN'       :
        days < 0       ? 'EXPIRED'       :
        days < 30      ? 'EXPIRING_SOON' :
        'VALID',
    }
  })

  return NextResponse.json({ data: result })
}
