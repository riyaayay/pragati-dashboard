import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as any
  if (!['SUPERVISOR', 'SITE_MANAGER'].includes(user.role)) {
    return NextResponse.json({ error: 'Not authorized to review' }, { status: 403 })
  }

  const { dprEntryId, action, comment } = await req.json()
  // action: 'APPROVE' | 'REJECT'

  const entry = await prisma.dprEntry.findUnique({ where: { id: dprEntryId } })
  if (!entry) return NextResponse.json({ error: 'Entry not found' }, { status: 404 })

  // RBAC: can only review entries for own site
  if (user.siteId && entry.siteId !== user.siteId) {
    return NextResponse.json({ error: 'Cannot review entries from other sites' }, { status: 403 })
  }

  let newStatus: string
  if (user.role === 'SUPERVISOR') {
    newStatus = action === 'APPROVE' ? 'PENDING_MANAGER' : 'REJECTED'
  } else {
    newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED'
  }

  await prisma.$transaction([
    prisma.dprReview.create({
      data: {
        dprEntryId,
        reviewerId: user.id,
        role:       user.role,
        status:     newStatus as any,
        comment,
      },
    }),
    prisma.dprEntry.update({
      where: { id: dprEntryId },
      data:  { approvalStatus: newStatus as any },
    }),
  ])

  return NextResponse.json({ success: true, newStatus })
}
