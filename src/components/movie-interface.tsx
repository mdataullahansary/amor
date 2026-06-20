'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Play, Link as LinkIcon, Users, Video } from 'lucide-react'
import { LiveKitRoom, VideoConference, RoomAudioRenderer } from '@livekit/components-react'
import '@livekit/components-styles'
import ReactPlayer from 'react-player'

export function MovieInterface({ userId, relationshipId }: { userId: string, relationshipId: string }) {
  const [videoUrl, setVideoUrl] = useState('')
  const [inRoom, setInRoom] = useState(false)
  const [token, setToken] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const roomName = `movie_${relationshipId}`

  useEffect(() => {
    if (inRoom) {
      // Fetch LiveKit token
      (async () => {
        try {
          const resp = await fetch(
            `/api/livekit?room=${roomName}&username=${userId}`
          )
          const data = await resp.json()
          if (!resp.ok) {
            setErrorMsg(data.error || 'Failed to connect to LiveKit')
            setInRoom(false)
            return
          }
          setToken(data.token)
        } catch (e: any) {
          setErrorMsg(e.message)
          setInRoom(false)
        }
      })()
    }
  }, [inRoom, roomName, userId])

  if (inRoom) {
    if (token === '') {
      return <div className="flex h-screen items-center justify-center bg-black text-white">Connecting to Movie Room...</div>
    }

    return (
      <div className="flex flex-col h-[calc(100vh-60px)] sm:h-screen bg-black" data-lk-theme="default">
        <header className="flex h-14 items-center justify-between border-b border-border/50 bg-black/50 px-4 backdrop-blur-sm text-white">
          <h1 className="text-lg font-heading font-medium">Movie Night</h1>
          <div className="flex gap-2">
            <Button variant="destructive" size="sm" onClick={() => setInRoom(false)}>Leave</Button>
          </div>
        </header>
        
        <div className="flex-1 flex flex-col md:flex-row relative">
          <div className="flex-1 relative flex items-center justify-center border-r border-border/50">
            {/* Real Video Player would go here, syncing playback via Supabase Broadcast */}
            <div className="aspect-video w-full bg-card/10 flex flex-col items-center justify-center text-muted-foreground relative">
               {videoUrl ? (
                 // @ts-ignore - react-player type exports are currently bugged with url prop
                 <ReactPlayer 
                   url={videoUrl} 
                   controls 
                   playing={true}
                   width="100%" 
                   height="100%"
                   className="absolute top-0 left-0"
                 />
               ) : (
                 <>
                   <Video className="h-12 w-12 mb-4 opacity-50" />
                   <p>Paste a valid video or YouTube URL to play.</p>
                 </>
               )}
            </div>
            
            {/* LiveKit Video Overlay for the couple */}
            <div className="absolute bottom-4 right-4 w-64 md:w-80 h-auto z-10 pointer-events-none opacity-80 hover:opacity-100 transition-opacity">
               <div className="pointer-events-auto shadow-2xl rounded-xl overflow-hidden border border-border/50">
                <LiveKitRoom
                  video={true}
                  audio={true}
                  token={token}
                  serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
                  connect={true}
                >
                  <VideoConference />
                  <RoomAudioRenderer />
                </LiveKitRoom>
               </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto space-y-8 mt-12">
      <div className="text-center space-y-4 mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
          <Video className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-heading font-semibold">Movie Night</h1>
        <p className="text-muted-foreground">Watch movies together with synced video and voice.</p>
        {errorMsg && (
          <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-md">
            {errorMsg}
          </div>
        )}
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Video URL (YouTube, Vimeo, MP4)</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="https://youtube.com/watch?v=..." 
                  className="pl-9 bg-input/50"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
              </div>
              <Button onClick={() => setInRoom(true)}>
                <Play className="h-4 w-4 mr-2" />
                Start
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Note: LiveKit keys must be set in .env.local</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
