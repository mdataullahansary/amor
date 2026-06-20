import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DiaryInterface } from '@/components/diary-interface'

export default async function DiaryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('relationship_id')
    .eq('id', user.id)
    .single()

  if (!userData?.relationship_id) {
    redirect('/setup')
  }

  return <DiaryInterface userId={user.id} relationshipId={userData.relationship_id} />
}
