import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as any
  const { searchParams } = new URL(req.url)
  const siteId = searchParams.get('siteId')

  const where: any = { isActive: true }
  if (!['MD', 'DGM', 'ADMIN'].includes(user.role)) {
    where.siteId = user.siteId
  } else if (siteId) {
    where.siteId = siteId
  }

  const machines = await prisma.machine.findMany({
    where,
    include: { site: true },
    orderBy: { assetCode: 'asc' },
  })

  return NextResponse.json({ data: machines })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as any
  if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const body = await req.json()
  const machine = await prisma.machine.create({ data: body })
  return NextResponse.json({ success: true, data: machine })
}
