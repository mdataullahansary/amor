'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const allowedEmails = ['ata@amor.com', 'anisa@amor.com']
  if (!allowedEmails.includes(email.toLowerCase())) {
    return { error: 'Access denied. This is a private space.' }
  }

  const supabase = await createClient()

  // Try to sign in
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // If user doesn't exist, try to sign them up automatically for testing
    if (error.message.includes('Invalid login credentials')) {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })
      if (signUpError) {
        return { error: signUpError.message }
      }
      // Successfully signed up. Since email confirmation is off, they are logged in.
      // Redirect to home page.
    } else {
      return { error: error.message }
    }
  }

  redirect('/')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return redirect('/login')
}
