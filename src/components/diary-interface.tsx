'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface DiaryEntry {
  id: string
  title: string
  content: string
  mood: string
  entry_date: string
  created_at: string
}

const MOODS = ['Happy', 'Love', 'Sad', 'Sick', 'Missing You', 'Special Day']

export function DiaryInterface({ userId, relationshipId }: { userId: string, relationshipId: string }) {
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const supabase = createClient()

  // New Entry Form State
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [mood, setMood] = useState('Happy')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchEntries()
  }, [relationshipId])

  const fetchEntries = async () => {
    const { data, error } = await supabase
      .from('diary_entries')
      .select('*')
      .eq('relationship_id', relationshipId)
      .order('entry_date', { ascending: false })

    if (error) {
      toast.error('Failed to load diary entries')
    } else {
      setEntries(data || [])
    }
    setLoading(false)
  }

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const { error } = await supabase.from('diary_entries').insert({
      relationship_id: relationshipId,
      author_id: userId,
      title,
      content,
      mood,
      entry_date: new Date().toISOString().split('T')[0]
    })

    setIsSubmitting(false)

    if (error) {
      toast.error('Failed to create entry')
    } else {
      toast.success('Memory preserved!')
      setOpen(false)
      // Reset form
      setTitle('')
      setContent('')
      setMood('Happy')
      fetchEntries() // Refresh list
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-semibold text-foreground">Our Diary</h1>
          <p className="text-muted-foreground mt-1">Preserve everyday memories.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="h-4 w-4 mr-2" />
            New Entry
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card border-border text-foreground">
            <DialogHeader>
              <DialogTitle className="font-heading">Write a Memory</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateEntry} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title (Optional)</Label>
                <Input 
                  id="title" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  className="bg-input border-border"
                  placeholder="e.g. A lazy Sunday"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mood">Mood</Label>
                <select 
                  id="mood" 
                  value={mood} 
                  onChange={(e) => setMood(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {MOODS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Entry</Label>
                <textarea 
                  id="content" 
                  value={content} 
                  onChange={(e) => setContent(e.target.value)} 
                  required
                  rows={5}
                  className="flex w-full rounded-md border border-input bg-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="What happened today?"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Entry'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <div className="space-y-6">
        {loading ? (
          <div className="text-muted-foreground">Loading memories...</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
            No memories written yet. Click 'New Entry' to start your shared diary.
          </div>
        ) : (
          <div className="relative pl-8 border-l border-border/50 space-y-8 pb-8">
            {entries.map((entry) => (
              <div key={entry.id} className="relative">
                <div className="absolute -left-9 top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
                <Card className="bg-card border-border shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                        {format(new Date(entry.entry_date), 'dd MMM yyyy')}
                      </span>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                        {entry.mood}
                      </span>
                    </div>
                    {entry.title && <CardTitle className="text-xl font-heading">{entry.title}</CardTitle>}
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                      {entry.content}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
