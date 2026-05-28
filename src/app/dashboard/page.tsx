import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import ExecutiveDashboard from '@/components/dashboard/ExecutiveDashboard'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const user = session.user as any

  // DI goes directly to submit
  if (user.role === 'DATA_INTERPRETER') redirect('/submit')
  // Supervisor goes to review queue
  if (user.role === 'SUPERVISOR') redirect('/review')

  return (
    <AppShell>
      <ExecutiveDashboard />
    </AppShell>
  )
}
