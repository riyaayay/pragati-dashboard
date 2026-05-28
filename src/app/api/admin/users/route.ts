import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const createUserSchema = z.object({
  name:     z.string().min(1),
  email:    z.string().email(),
  password: z.string().min(6),
  role:     z.enum(['ADMIN','MD','DGM','SITE_MANAGER','SUPERVISOR','DATA_INTERPRETER']),
  siteId:   z.string().nullable().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    include: { site: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ data: users.map(u => ({ ...u, passwordHash: undefined })) })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const body   = await req.json()
  const parsed = createUserSchema.parse(body)

  const existing = await prisma.user.findUnique({ where: { email: parsed.email } })
  if (existing) return NextResponse.json({ error: 'Email already exists' }, { status: 400 })

  const user = await prisma.user.create({
    data: {
      name:         parsed.name,
      email:        parsed.email,
      passwordHash: await bcrypt.hash(parsed.password, 12),
      role:         parsed.role as any,
      siteId:       parsed.siteId || null,
    },
  })

  return NextResponse.json({ success: true, id: user.id })
}
