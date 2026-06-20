import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'

export default async function TimelinePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: userData } = await supabase.from('users').select('relationship_id').eq('id', user.id).single()
  if (!userData?.relationship_id) redirect('/setup')

  // In a real app, this would be a complex UNION query or a dedicated table.
  // For the scaffold, we fetch diaries and movies to simulate the timeline.
  const { data: diaries } = await supabase
    .from('diary_entries')
    .select('id, title, created_at, mood')
    .eq('relationship_id', userData.relationship_id)

  const { data: movies } = await supabase
    .from('movie_sessions')
    .select('id, movie_title, created_at')
    .eq('relationship_id', userData.relationship_id)

  const timelineEvents = [
    ...(diaries || []).map(d => ({ type: 'diary', date: new Date(d.created_at), data: d })),
    ...(movies || []).map(m => ({ type: 'movie', date: new Date(m.created_at), data: m }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime())

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto space-y-8">
      <header className="mb-8">
        <h1 className="text-3xl font-heading font-semibold text-foreground">Our Story</h1>
        <p className="text-muted-foreground mt-1">An emotional timeline of us.</p>
      </header>

      {timelineEvents.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
          No events recorded yet. Your story begins here.
        </div>
      ) : (
        <div className="relative pl-6 border-l-2 border-primary/20 space-y-8 pb-8">
          {timelineEvents.map((event, idx) => (
            <div key={idx} className="relative">
              <div className="absolute -left-[31px] top-1 h-4 w-4 rounded-full bg-card border-2 border-primary" />
              <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block mb-2">
                  {format(event.date, 'MMMM do, yyyy')}
                </span>
                {event.type === 'diary' && (
                  <div>
                    <h3 className="font-heading text-lg">Diary Entry: {event.data.title || 'A memory'}</h3>
                    <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full mt-2 inline-block">Mood: {event.data.mood}</span>
                  </div>
                )}
                {event.type === 'movie' && (
                  <div>
                    <h3 className="font-heading text-lg">Movie Night: {event.data.movie_title}</h3>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
