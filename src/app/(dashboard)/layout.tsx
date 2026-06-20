import { Heart, MessageCircle, Film, Book, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const navItems = [
  { href: '/', icon: Heart, label: 'Home' },
  { href: '/chat', icon: MessageCircle, label: 'Chat' },
  { href: '/movie', icon: Film, label: 'Movie' },
  { href: '/diary', icon: Book, label: 'Diary' },
  { href: '/gallery', icon: ImageIcon, label: 'Gallery' },
]

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user has a relationship
  const { data: userData } = await supabase
    .from('users')
    .select('relationship_id')
    .eq('id', user.id)
    .single()

  if (!userData?.relationship_id) {
    // If no relationship, they need to create one or join one
    redirect('/setup')
  }

  return (
    <div className="flex h-screen flex-col bg-background text-foreground pb-[60px] sm:pb-0 sm:pl-[80px]">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-[80px] flex-col items-center border-r border-border bg-card py-8 sm:flex">
        <div className="mb-8 rounded-full bg-primary/10 p-2 text-primary">
          <Heart className="h-6 w-6" />
        </div>
        <nav className="flex flex-col gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors"
            >
              <item.icon className="h-6 w-6" />
              <span className="text-[10px] uppercase tracking-wider">{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 flex h-[60px] items-center justify-around border-t border-border bg-card sm:hidden pb-safe">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors p-2"
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] uppercase tracking-wider">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
