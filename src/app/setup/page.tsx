'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createRelationship, joinRelationship } from './actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function SetupPage() {
  const [inviteLink, setInviteLink] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleCreate = async () => {
    setLoading(true)
    const result = await createRelationship()
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else if (result.token) {
      const origin = window.location.origin
      const link = `${origin}/invite/${result.token}`
      setInviteLink(link)
      toast.success('Space created! Copy the link to invite your partner.')
    }
  }

  const handleJoin = async (formData: FormData) => {
    setLoading(true)
    const result = await joinRelationship(formData)
    setLoading(false)
    if (result?.error) {
      toast.error(result.error)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-heading tracking-tight">Create Your Space</CardTitle>
          <CardDescription className="text-muted-foreground">
            You don't have a relationship space yet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Create a new space</Label>
            {inviteLink ? (
              <div className="flex gap-2">
                <Input 
                  readOnly 
                  value={inviteLink} 
                  className="bg-input/50 border-border text-muted-foreground"
                />
                <Button variant="secondary" onClick={() => {
                  navigator.clipboard.writeText(inviteLink)
                  toast.success('Copied to clipboard')
                }}>Copy</Button>
              </div>
            ) : (
              <Button onClick={handleCreate} className="w-full" disabled={loading}>
                Generate Invite Link
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              Send this 1-time link to your partner.
            </p>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <form action={handleJoin} className="space-y-2">
            <Label>Have an invite link?</Label>
            <div className="flex gap-2">
              <Input name="token" placeholder="Paste your link here" className="bg-input border-border" required />
              <Button type="submit" disabled={loading}>Join</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
