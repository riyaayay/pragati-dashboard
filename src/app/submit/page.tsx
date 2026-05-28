import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import DprSubmitForm from '@/components/submit/DprSubmitForm'

export default async function SubmitPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const user = session.user as any
  if (user.role !== 'DATA_INTERPRETER') redirect('/dashboard')
  return <DprSubmitForm siteId={user.siteId} userName={user.name} />
}
