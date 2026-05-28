import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user  = session.user as any
  const where: any = {}
  if (!['MD', 'DGM', 'ADMIN'].includes(user.role)) {
    where.machine = { siteId: user.siteId }
  }

  const logs = await prisma.breakdownLog.findMany({
    where,
    include: { machine: { include: { site: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ data: logs })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as any
  if (!['SUPERVISOR', 'SITE_MANAGER', 'ADMIN'].includes(user.role)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const body = await req.json()
  const log  = await prisma.breakdownLog.create({ data: body })
  return NextResponse.json({ success: true, data: log })
}

export async function PATCH(req: NextRequest) {
  // Mark as resolved
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, actionTaken } = await req.json()
  const log = await prisma.breakdownLog.update({
    where: { id },
    data:  { resolvedAt: new Date(), actionTaken, status: 'RUNNING' },
  })
  return NextResponse.json({ success: true, data: log })
}
