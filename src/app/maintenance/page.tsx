import AppShell from '@/components/AppShell'
import MaintenancePage from '@/components/maintenance/MaintenancePage'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function Page() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  return <AppShell><MaintenancePage /></AppShell>
}
