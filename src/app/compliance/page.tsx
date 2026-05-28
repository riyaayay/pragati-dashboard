import AppShell from '@/components/AppShell'
import CompliancePage from '@/components/compliance/CompliancePage'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function Page() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  return <AppShell><CompliancePage /></AppShell>
}
