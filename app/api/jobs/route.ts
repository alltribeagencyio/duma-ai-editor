import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import heicConvert from 'heic-convert'

// Helper function to convert HEIC to JPEG
async function convertHeicToJpeg(file: File): Promise<{ buffer: Buffer; fileName: string }> {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const outputBuffer = await heicConvert({
    buffer,
    format: 'JPEG',
    quality: 0.9,
  })

  // Change file extension to .jpg
  const fileName = file.name.replace(/\.(heic|HEIC)$/i, '.jpg')

  return {
    buffer: Buffer.from(outputBuffer),
    fileName,
  }
}

// GET /api/jobs - List all jobs for the authenticated user
export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const jobs = await prisma.job.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ jobs })
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    )
  }
}

// POST /api/jobs - Create a new job
export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const prompt = formData.get('prompt') as string
    const promptType = formData.get('promptType') as string
    const presetId = formData.get('presetId') as string | null
    const phone = formData.get('phone') as string | null
    const notifyByEmail = formData.get('notifyByEmail') === 'true'
    const productName = formData.get('productName') as string | null
    const productCategory = formData.get('productCategory') as string | null
    const productSku = formData.get('productSku') as string | null
    const images = formData.getAll('images') as File[]

    if (!prompt || !promptType || images.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Upload images to Supabase Storage
    const inputImageUrls: string[] = []
    for (let i = 0; i < images.length; i++) {
      const file = images[i]
      let uploadData: Buffer | File = file
      let uploadFileName = file.name

      // Check if file is HEIC and convert to JPEG
      if (file.name.match(/\.(heic|HEIC)$/i)) {
        console.log(`🔄 Converting HEIC to JPEG: ${file.name}`)
        const converted = await convertHeicToJpeg(file)
        uploadData = converted.buffer
        uploadFileName = converted.fileName
        console.log(`✅ Converted to: ${uploadFileName}`)
      }

      const fileName = `${user.id}/${Date.now()}-${i}-${uploadFileName}`

      const { data, error } = await supabase.storage
        .from('temp-images')
        .upload(fileName, uploadData, {
          contentType: uploadFileName.endsWith('.jpg') ? 'image/jpeg' : undefined,
        })

      if (error) {
        console.error('Error uploading image:', error)
        throw new Error('Failed to upload image')
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('temp-images').getPublicUrl(fileName)

      inputImageUrls.push(publicUrl)
    }

    // Create job in database
    const job = await prisma.job.create({
      data: {
        userId: user.id,
        prompt,
        promptType,
        presetId,
        phone,
        notifyByEmail,
        productName,
        productCategory,
        productSku,
        inputImages: inputImageUrls,
        status: 'pending',
      },
    })

    // Send webhook to n8n
    const webhookUrl = process.env.N8N_WEBHOOK_URL
    console.log('📤 Webhook URL:', webhookUrl)

    if (webhookUrl) {
      const webhookPayload = {
        jobId: job.id,
        userId: user.id,
        userEmail: user.email,
        imageUrls: inputImageUrls,
        prompt,
        productName,
        productCategory,
        productSku,
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/callback`,
      }

      console.log('📤 Sending webhook payload:', JSON.stringify(webhookPayload, null, 2))

      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookPayload),
        })

        console.log('📤 Webhook response status:', response.status)
        const responseText = await response.text()
        console.log('📤 Webhook response:', responseText)

        if (response.ok) {
          // Update job status to processing
          await prisma.job.update({
            where: { id: job.id },
            data: { status: 'processing', startedAt: new Date() },
          })
          console.log('✅ Job status updated to processing')
        } else {
          console.error('❌ Webhook returned error status:', response.status)
        }
      } catch (webhookError) {
        console.error('❌ Error sending webhook:', webhookError)
        // Don't fail the whole request if webhook fails
      }
    } else {
      console.log('⚠️  No webhook URL configured')
    }

    return NextResponse.json({ job }, { status: 201 })
  } catch (error) {
    console.error('Error creating job:', error)
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    )
  }
}
