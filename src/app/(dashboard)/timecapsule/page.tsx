import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TimeCapsuleInterface } from '@/components/timecapsule-interface'

export default async function TimeCapsulePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('relationship_id')
    .eq('id', user.id)
    .single()

  if (!userData?.relationship_id) redirect('/setup')

  return <TimeCapsuleInterface userId={user.id} relationshipId={userData.relationship_id} />
}
