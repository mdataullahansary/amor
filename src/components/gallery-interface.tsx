'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heart, Upload, Image as ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { CldUploadWidget, CldImage } from 'next-cloudinary'
import { format } from 'date-fns'

interface GalleryItem {
  id: string
  media_url: string
  media_type: string
  is_favorite: boolean
  caption: string | null
  item_date: string
}

export function GalleryInterface({ userId, relationshipId }: { userId: string, relationshipId: string }) {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchGallery()
  }, [relationshipId])

  const fetchGallery = async () => {
    const { data } = await supabase
      .from('gallery_items')
      .select('*')
      .eq('relationship_id', relationshipId)
      .order('item_date', { ascending: false })
    
    if (data) setItems(data)
    setLoading(false)
  }

  const toggleFavorite = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from('gallery_items').update({ is_favorite: !currentStatus }).eq('id', id)
    if (!error) fetchGallery()
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-semibold text-foreground">Memory Gallery</h1>
          <p className="text-muted-foreground mt-1">A private collection of our moments.</p>
        </div>
        
        {/* Cloudinary Upload Widget */}
        <CldUploadWidget 
          uploadPreset="amor_preset" // You will need to create an unsigned preset in Cloudinary named 'amor_preset'
          onSuccess={async (result: any) => {
            const secureUrl = result.info.secure_url;
            await supabase.from('gallery_items').insert({
              relationship_id: relationshipId,
              uploader_id: userId,
              media_url: secureUrl,
              media_type: 'image',
              item_date: new Date().toISOString().split('T')[0]
            })
            toast.success('Memory uploaded!')
            fetchGallery()
          }}
        >
          {({ open }) => {
            return (
              <Button onClick={() => open()} variant="secondary">
                <Upload className="h-4 w-4 mr-2" />
                Upload Image
              </Button>
            );
          }}
        </CldUploadWidget>
      </header>

      {loading ? (
        <div className="text-muted-foreground">Loading memories...</div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed border-border rounded-lg text-muted-foreground">
          <ImageIcon className="h-12 w-12 mb-4 opacity-50" />
          <p>Your gallery is empty. Upload a photo to start.</p>
          <p className="text-xs mt-2 text-primary">Note: Cloudinary keys must be configured in .env.local</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div key={item.id} className="aspect-square bg-card border border-border rounded-xl overflow-hidden group relative flex items-center justify-center">
              <CldImage
                width="600"
                height="600"
                src={item.media_url}
                alt="Memory"
                crop="fill"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-end p-4">
                <span className="text-white text-xs font-medium">{format(new Date(item.item_date), 'MMM d, yyyy')}</span>
                <button onClick={() => toggleFavorite(item.id, item.is_favorite)} className="text-white hover:scale-110 transition-transform">
                  <Heart className={`h-5 w-5 ${item.is_favorite ? 'fill-primary text-primary' : ''}`} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
