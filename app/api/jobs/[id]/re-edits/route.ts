import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// GET /api/jobs/[id]/re-edits - Fetch all re-edit jobs for a parent job
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: jobId } = params

    // Verify the parent job belongs to the user
    const parentJob = await prisma.job.findFirst({
      where: {
        id: jobId,
        userId: user.id,
      },
    })

    if (!parentJob) {
      return NextResponse.json(
        { error: 'Job not found or not accessible' },
        { status: 404 }
      )
    }

    // Fetch all re-edit jobs for this parent job
    const reEdits = await prisma.job.findMany({
      where: {
        parentJobId: jobId,
        isReEdit: true,
        userId: user.id,
      },
      orderBy: {
        createdAt: 'asc', // Chronological order to show progression
      },
    })

    return NextResponse.json({ reEdits }, { status: 200 })
  } catch (error) {
    console.error('Error fetching re-edits:', error)
    return NextResponse.json(
      { error: 'Failed to fetch re-edits' },
      { status: 500 }
    )
  }
}
