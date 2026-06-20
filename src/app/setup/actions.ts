'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createRelationship() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // 1. Create a new relationship
  const { data: relationship, error: relError } = await supabase
    .from('relationships')
    .insert({ start_date: new Date().toISOString().split('T')[0] })
    .select()
    .single()

  if (relError) {
    console.error('Relationship Insert Error:', relError)
    return { error: `Failed to create relationship: ${relError.message}` }
  }

  // 2. Link user to the relationship (upsert to ensure user row exists)
  const { error: userError } = await supabase
    .from('users')
    .upsert({ id: user.id, email: user.email, relationship_id: relationship.id })

  if (userError) {
    console.error('User Link Error:', userError)
    return { error: `Failed to link user: ${userError.message}` }
  }

  // Generate an invite code (In a real app, store this in an invites table)
  // For simplicity, we can encode the relationship_id
  const token = Buffer.from(relationship.id).toString('base64')
  
  return { success: true, token }
}

export async function joinRelationship(formData: FormData) {
  const token = formData.get('token') as string
  if (!token) return { error: 'Token is required' }

  let relationshipId = ''
  try {
    // Determine if it's a full URL or just the token
    const rawToken = token.includes('/') ? token.split('/').pop() : token
    relationshipId = Buffer.from(rawToken || '', 'base64').toString('ascii')
  } catch (e) {
    return { error: 'Invalid invite link' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // Check if relationship exists
  const { data: relationship } = await supabase
    .from('relationships')
    .select('id')
    .eq('id', relationshipId)
    .single()

  if (!relationship) return { error: 'Relationship not found' }

  // Check how many users are in this relationship
  const { count } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('relationship_id', relationshipId)

  if (count && count >= 2) {
    return { error: 'This space is already full (max 2 people).' }
  }

  // Link user (upsert to ensure user row exists)
  const { error: userError } = await supabase
    .from('users')
    .upsert({ id: user.id, email: user.email, relationship_id: relationshipId })

  if (userError) return { error: 'Failed to join space' }

  redirect('/')
}
