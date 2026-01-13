import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GalleryClient } from '@/components/gallery/GalleryClient'

export const metadata = {
  title: 'Gallery - Duma AI Image Editor',
  description: 'View and download all your edited images',
}

export default async function GalleryPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <GalleryClient userEmail={user.email || ''} />
}
