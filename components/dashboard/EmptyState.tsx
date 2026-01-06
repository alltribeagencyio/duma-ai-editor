import Link from 'next/link'
import { ImageOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <ImageOff className="h-16 w-16 text-gray-300 mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No edits yet</h3>
      <p className="text-gray-600 mb-6">
        Start by uploading your first product images
      </p>
      <Link href="/new">
        <Button size="lg">Create First Edit</Button>
      </Link>
    </div>
  )
}
