import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import DprReport from '@/components/dpr/DprReport'

export default async function DprPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const user = session.user as any
  if (user.role === 'DATA_INTERPRETER') redirect('/submit')
  return <AppShell><DprReport /></AppShell>
}
