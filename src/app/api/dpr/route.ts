import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const filterSchema = z.object({
  siteId:    z.string().optional(),
  dateFrom:  z.string().optional(),
  dateTo:    z.string().optional(),
  machineId: z.string().optional(),
  status:    z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user    = session.user as any
  const params  = Object.fromEntries(new URL(req.url).searchParams)
  const filters = filterSchema.parse(params)

  // RBAC: DI and Supervisor only see their own site
  const siteFilter = ['MD', 'DGM', 'ADMIN'].includes(user.role)
    ? (filters.siteId ? { siteId: filters.siteId } : {})
    : { siteId: user.siteId }

  const dateFilter: any = {}
  if (filters.dateFrom) dateFilter.gte = new Date(filters.dateFrom)
  if (filters.dateTo)   dateFilter.lte = new Date(filters.dateTo)

  const entries = await prisma.dprEntry.findMany({
    where: {
      ...siteFilter,
      ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}),
      ...(filters.machineId ? { machineId: filters.machineId } : {}),
      ...(filters.status    ? { approvalStatus: filters.status as any } : {}),
    },
    include: {
      machine: { include: { site: true } },
      site:    true,
      submitter: { select: { name: true } },
      reviews: { include: { reviewer: { select: { name: true, role: true } } }, orderBy: { reviewedAt: 'desc' } },
    },
    orderBy: [{ date: 'desc' }, { machine: { assetCode: 'asc' } }],
  })

  return NextResponse.json({ data: entries })
}

// POST — DI submits DPR
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as any
  if (user.role !== 'DATA_INTERPRETER') {
    return NextResponse.json({ error: 'Only Data Interpreters can submit DPR' }, { status: 403 })
  }

  const body = await req.json()

  // Parse all numeric fields — form inputs send strings, Prisma needs Float
  const startingReading  = body.startingReading  != null ? parseFloat(body.startingReading)  : null
  const closingReading   = body.closingReading   != null ? parseFloat(body.closingReading)   : null
  const dieselOpBal      = parseFloat(body.dieselOpBal)      || 0
  const dieselIssued     = parseFloat(body.dieselIssued)     || 0
  const dieselConsumption= parseFloat(body.dieselConsumption)|| 0
  const stdAverage       = body.stdAverage != null ? parseFloat(body.stdAverage) : null
  const workdoneQty      = body.workdoneQty != null ? parseFloat(body.workdoneQty) : null

  // Auto-compute derived fields
  const totalHrKm        = (closingReading || 0) - (startingReading || 0)
  const totalDiesel      = dieselOpBal + dieselIssued
  const closingDieselBal = totalDiesel - dieselConsumption
  const actualAverage    = dieselConsumption > 0
    ? parseFloat((totalHrKm / dieselConsumption).toFixed(2))
    : null

  try {
    const entry = await prisma.dprEntry.create({
      data: {
        date:             new Date(body.date),
        siteId:           user.siteId,
        machineId:        body.machineId,
        operatorName:     body.operatorName     || null,
        startingReading,
        closingReading,
        totalHrKm,
        dieselOpBal,
        dieselIssued,
        totalDiesel,
        dieselConsumption,
        closingDieselBal,
        actualAverage,
        stdAverage,
        workdoneUnit:     body.workdoneUnit     || null,
        workdoneQty,
        workdoneDetails:  body.workdoneDetails  || null,
        remarks:          body.remarks          || null,
        submittedBy:      user.id,
        approvalStatus:   'PENDING_SUPERVISOR',
      },
    })
    return NextResponse.json({ success: true, id: entry.id })
  } catch (err: any) {
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'DPR for this machine on this date already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to save DPR' }, { status: 500 })
  }
}
