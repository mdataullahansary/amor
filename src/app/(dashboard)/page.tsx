import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Calendar, Clock, Image as ImageIcon, Heart, ChevronRight, Lock } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Example fetch for relationship stats
  const { data: userData } = await supabase.from('users').select('relationship_id').eq('id', user?.id).single()
  const relationshipId = userData?.relationship_id

  let daysTogether = 0
  let messageCount = 0
  let memoryCount = 0

  if (relationshipId) {
    // Hardcoded start date requested by user
    const startDate = new Date("2025-11-08T00:39:00")
    daysTogether = Math.floor((new Date().getTime() - startDate.getTime()) / (1000 * 3600 * 24))

    const { count: msgs } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('relationship_id', relationshipId)
    messageCount = msgs || 0

    const { count: galleries } = await supabase.from('gallery_items').select('*', { count: 'exact', head: true }).eq('relationship_id', relationshipId)
    const { count: diaries } = await supabase.from('diary_entries').select('*', { count: 'exact', head: true }).eq('relationship_id', relationshipId)
    memoryCount = (galleries || 0) + (diaries || 0)
  }
  const name = user?.email?.startsWith('ata') ? 'Ata' : user?.email?.startsWith('anisa') ? 'Anisa' : 'Love'

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-8 mt-4 sm:mt-8">
      <header className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-semibold text-foreground">Welcome back, {name}</h1>
          <p className="text-muted-foreground mt-1">Your relationship at a glance.</p>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full border border-primary/20 w-fit">
          <Heart className="w-4 h-4 text-primary fill-primary" />
          <span className="text-sm font-medium text-primary">Ata & Anisa</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/20 to-card border-primary/20 shadow-sm relative overflow-hidden md:col-span-2">
          <div className="absolute -right-4 -top-4 opacity-10">
            <Heart className="w-32 h-32" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-muted-foreground font-medium">Days Together</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold text-foreground font-heading">{daysTogether}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-muted-foreground font-medium">Love Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold text-primary font-heading">
              {Math.min(100, Math.floor(messageCount * 0.5 + memoryCount * 5))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-muted-foreground font-medium">Memories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold text-foreground font-heading">{memoryCount}</div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-heading font-semibold mt-12 mb-4">Features</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/calendar">
          <Card className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer group">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-xl text-primary">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-medium text-lg">Shared Calendar</h3>
                  <p className="text-sm text-muted-foreground">Plan dates and remember anniversaries</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/timeline">
          <Card className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer group">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-xl text-primary">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-medium text-lg">Memory Timeline</h3>
                  <p className="text-sm text-muted-foreground">Chronological history of your journey</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/timecapsule">
          <Card className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer group">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-xl text-primary">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-medium text-lg">Time Capsules</h3>
                  <p className="text-sm text-muted-foreground">Lock memories for the future</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
