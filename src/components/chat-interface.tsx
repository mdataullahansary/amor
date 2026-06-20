'use client'

import { useEffect, useState, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Image as ImageIcon, Mic } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface Message {
  id: string
  relationship_id: string
  sender_id: string
  content: string
  message_type: string
  media_url: string | null
  created_at: string
}

export function ChatInterface({ userId, relationshipId }: { userId: string, relationshipId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('relationship_id', relationshipId)
        .order('created_at', { ascending: true })
        .limit(50)

      if (error) {
        toast.error('Failed to load messages')
      } else {
        setMessages(data || [])
      }
      setLoading(false)
      scrollToBottom()
    }

    fetchMessages()

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`chat_${relationshipId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `relationship_id=eq.${relationshipId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message])
          scrollToBottom()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [relationshipId])

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const tempMessage = newMessage
    setNewMessage('')

    const { error } = await supabase.from('messages').insert({
      relationship_id: relationshipId,
      sender_id: userId,
      content: tempMessage,
      message_type: 'text',
    })

    if (error) {
      toast.error('Failed to send message')
      setNewMessage(tempMessage) // restore message on failure
    }
  }

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-muted-foreground">Loading messages...</div>
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 items-center border-b border-border bg-card/50 px-4 backdrop-blur-sm sticky top-0 z-10">
        <h1 className="text-lg font-heading font-medium">Chat</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2">
            <MessageCircle className="h-12 w-12 opacity-20" />
            <p>No messages yet. Send a message to start!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === userId
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`
                  max-w-[80%] rounded-2xl px-4 py-2 
                  ${isMe ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-card border border-border rounded-tl-sm'}
                `}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <span className={`text-[10px] mt-1 block ${isMe ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground'}`}>
                    {format(new Date(msg.created_at), 'hh:mm a')}
                  </span>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-border bg-card">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="icon" className="text-muted-foreground shrink-0">
            <ImageIcon className="h-5 w-5" />
          </Button>
          <Input 
            placeholder="Type a message..." 
            className="flex-1 bg-input/50 border-border rounded-full px-4"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <Button type="button" variant="ghost" size="icon" className="text-muted-foreground shrink-0">
            <Mic className="h-5 w-5" />
          </Button>
          <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}

function MessageCircle(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
  )
}
