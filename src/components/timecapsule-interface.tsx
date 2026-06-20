'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, Unlock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface Capsule {
  id: string
  title: string
  message: string
  unlock_date: string
  is_opened: boolean
}

export function TimeCapsuleInterface({ userId, relationshipId }: { userId: string, relationshipId: string }) {
  const [capsules, setCapsules] = useState<Capsule[]>([])
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [unlockDate, setUnlockDate] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchCapsules()
  }, [relationshipId])

  const fetchCapsules = async () => {
    const { data } = await supabase
      .from('time_capsules')
      .select('*')
      .eq('relationship_id', relationshipId)
      .order('unlock_date', { ascending: true })
    if (data) setCapsules(data)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.from('time_capsules').insert({
      relationship_id: relationshipId,
      creator_id: userId,
      title,
      message,
      unlock_date: new Date(unlockDate).toISOString()
    })

    setLoading(false)

    if (error) {
      toast.error('Failed to seal time capsule')
    } else {
      toast.success('Time capsule sealed!')
      setTitle('')
      setMessage('')
      setUnlockDate('')
      fetchCapsules()
    }
  }

  const handleOpen = async (capsule: Capsule) => {
    if (new Date(capsule.unlock_date) > new Date()) {
      toast.error("It's not time to open this yet!")
      return
    }

    await supabase.from('time_capsules').update({ is_opened: true }).eq('id', capsule.id)
    fetchCapsules()
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-8">
      <header className="mb-8">
        <h1 className="text-3xl font-heading font-semibold text-foreground">Time Capsules</h1>
        <p className="text-muted-foreground mt-1">Send a message to the future.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Seal a new memory</CardTitle>
            <CardDescription>Lock it until a specific date in the future.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} required className="bg-input/50" />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <textarea 
                  value={message} 
                  onChange={e => setMessage(e.target.value)} 
                  required
                  rows={4}
                  className="flex w-full rounded-md border border-input bg-input/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label>Unlock Date</Label>
                <Input type="date" value={unlockDate} onChange={e => setUnlockDate(e.target.value)} required className="bg-input/50" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                <Lock className="w-4 h-4 mr-2" />
                Seal Capsule
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="font-heading text-xl">Your Capsules</h2>
          {capsules.length === 0 ? (
            <div className="text-muted-foreground p-8 border border-dashed border-border rounded-lg text-center">
              No time capsules found.
            </div>
          ) : (
            capsules.map(capsule => {
              const isReady = new Date(capsule.unlock_date) <= new Date()
              return (
                <Card key={capsule.id} className={`bg-card border-border ${!capsule.is_opened && !isReady ? 'opacity-70' : ''}`}>
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{capsule.title}</CardTitle>
                      <CardDescription>Unlocks: {format(new Date(capsule.unlock_date), 'dd MMM yyyy')}</CardDescription>
                    </div>
                    {capsule.is_opened ? <Unlock className="h-5 w-5 text-primary" /> : <Lock className="h-5 w-5 text-muted-foreground" />}
                  </CardHeader>
                  <CardContent>
                    {!capsule.is_opened ? (
                      <Button variant={isReady ? 'default' : 'secondary'} className="w-full" onClick={() => handleOpen(capsule)} disabled={!isReady}>
                        {isReady ? 'Open Capsule' : 'Locked'}
                      </Button>
                    ) : (
                      <div className="bg-input/30 p-4 rounded-md italic">
                        "{capsule.message}"
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
