import AppShell from '@/components/AppShell'
import ReviewQueue from '@/components/review/ReviewQueue'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function Page() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const user = session.user as any
  if (!['SUPERVISOR', 'SITE_MANAGER', 'ADMIN'].includes(user.role)) redirect('/dashboard')
  return <AppShell><ReviewQueue /></AppShell>
}
