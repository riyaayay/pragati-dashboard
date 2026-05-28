import AppShell from '@/components/AppShell'
import AdminPanel from '@/components/admin/AdminPanel'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function Page() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const user = session.user as any
  if (user.role !== 'ADMIN') redirect('/dashboard')
  return <AppShell><AdminPanel /></AppShell>
}
