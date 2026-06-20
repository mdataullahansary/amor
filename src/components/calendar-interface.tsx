'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar as CalendarIcon, Plus, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { format, isSameMonth, parseISO } from 'date-fns'

interface CalendarEvent {
  id: string
  title: string
  description: string | null
  event_date: string
  event_type: string
}

export function CalendarInterface({ userId, relationshipId }: { userId: string, relationshipId: string }) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventType, setEventType] = useState('Date')
  const supabase = createClient()

  useEffect(() => {
    fetchEvents()
  }, [relationshipId])

  const fetchEvents = async () => {
    const { data } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('relationship_id', relationshipId)
      .order('event_date', { ascending: true })
    if (data) setEvents(data)
    setLoading(false)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('calendar_events').insert({
      relationship_id: relationshipId,
      creator_id: userId,
      title,
      event_date: new Date(eventDate).toISOString(),
      event_type: eventType,
    })

    if (error) {
      toast.error('Failed to add event')
    } else {
      toast.success('Event added to calendar!')
      setTitle('')
      setEventDate('')
      fetchEvents()
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-8 mt-4 sm:mt-12">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-semibold flex items-center gap-2">
            <CalendarIcon className="h-8 w-8 text-primary" /> Shared Calendar
          </h1>
          <p className="text-muted-foreground mt-1">Never miss a special moment.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="bg-card border-border h-fit">
          <CardHeader>
            <CardTitle>Add Event</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Event Title</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Dinner at Luigi's" className="bg-input/50" />
              </div>
              <div className="space-y-2">
                <Label>Date & Time</Label>
                <Input type="datetime-local" value={eventDate} onChange={e => setEventDate(e.target.value)} required className="bg-input/50" />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <select 
                  value={eventType} 
                  onChange={e => setEventType(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-input/50 px-3 py-2 text-sm"
                >
                  <option value="Date">Date</option>
                  <option value="Anniversary">Anniversary</option>
                  <option value="Birthday">Birthday</option>
                  <option value="Movie Night">Movie Night</option>
                  <option value="Appointment">Appointment</option>
                </select>
              </div>
              <Button type="submit" className="w-full">
                <Plus className="w-4 h-4 mr-2" /> Add to Calendar
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-4">
          <h2 className="font-heading text-xl">Upcoming Events</h2>
          {loading ? (
            <div className="text-muted-foreground">Loading calendar...</div>
          ) : events.filter(e => new Date(e.event_date) >= new Date()).length === 0 ? (
            <div className="text-muted-foreground p-8 border border-dashed border-border rounded-lg text-center">
              No upcoming events planned. Plan a date night!
            </div>
          ) : (
            <div className="space-y-3">
              {events.filter(e => new Date(e.event_date) >= new Date()).map(event => (
                <div key={event.id} className="flex bg-card border border-border rounded-lg p-4 items-center gap-4">
                  <div className="flex flex-col items-center justify-center bg-primary/10 text-primary w-16 h-16 rounded-md shrink-0">
                    <span className="text-xs uppercase font-medium">{format(parseISO(event.event_date), 'MMM')}</span>
                    <span className="text-xl font-bold">{format(parseISO(event.event_date), 'd')}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-lg">{event.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Clock className="w-3 h-3" />
                      {format(parseISO(event.event_date), 'h:mm a')} • <span className="text-primary">{event.event_type}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
