'use client'

import { useState } from 'react'
import { Download, FileArchive, CheckSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DownloadActionsProps {
  imageUrls: string[]
  selectedUrls?: string[]
}

export function DownloadActions({ imageUrls = [], selectedUrls = [] }: DownloadActionsProps) {
  const [downloading, setDownloading] = useState(false)

  const downloadAsZip = async (urls: string[]) => {
    setDownloading(true)

    try {
      // Lazy load JSZip and file-saver only when user clicks ZIP button
      const [JSZip, { saveAs }] = await Promise.all([
        import('jszip').then(mod => mod.default),
        import('file-saver')
      ])

      const zip = new JSZip()

      for (let i = 0; i < urls.length; i++) {
        const url = urls[i]
        // Fetch image from URL
        const response = await fetch(url)
        const blob = await response.blob()

        // Extract filename from URL or generate one
        const filename = url.split('/').pop()?.split('?')[0] || `edited-image-${i + 1}.png`
        zip.file(filename, blob)
      }

      const content = await zip.generateAsync({ type: 'blob' })
      saveAs(content, `edited-images-${Date.now()}.zip`)
    } catch (error) {
      console.error('Error creating zip:', error)
    } finally {
      setDownloading(false)
    }
  }

  const downloadIndividually = async (urls: string[]) => {
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i]
      try {
        const response = await fetch(url)
        const blob = await response.blob()
        const blobUrl = window.URL.createObjectURL(blob)

        const link = document.createElement('a')
        link.href = blobUrl
        const filename = url.split('/').pop()?.split('?')[0] || `edited-image-${i + 1}.png`
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(blobUrl)

        // Add delay to avoid browser blocking
        if (i < urls.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100))
        }
      } catch (error) {
        console.error('Error downloading image:', error)
      }
    }
  }

  const hasSelection = selectedUrls.length > 0
  const downloadUrls = hasSelection ? selectedUrls : imageUrls

  return (
    <div className="flex items-center gap-2 p-6 border-b border-gray-200">
      {hasSelection && (
        <span className="text-sm text-gray-600 mr-2">
          {selectedUrls.length} selected
        </span>
      )}

      <Button
        variant="outline"
        onClick={() => downloadIndividually(downloadUrls)}
        disabled={downloading || imageUrls.length === 0}
      >
        <Download className="h-4 w-4 mr-2" />
        {hasSelection ? 'Download Selected' : 'Download All'}
      </Button>

      <Button
        onClick={() => downloadAsZip(downloadUrls)}
        disabled={downloading || imageUrls.length === 0}
      >
        <FileArchive className="h-4 w-4 mr-2" />
        {downloading ? 'Preparing...' : hasSelection ? 'ZIP Selected' : 'Download ZIP'}
      </Button>

      {imageUrls.length > 0 && (
        <span className="text-sm text-gray-500 ml-2">
          {imageUrls.length} image{imageUrls.length !== 1 ? 's' : ''} ready
        </span>
      )}
    </div>
  )
}
