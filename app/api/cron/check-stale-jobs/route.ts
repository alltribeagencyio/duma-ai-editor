import { NextRequest, NextResponse } from 'next/server'
import { markStaleJobsFailed } from '@/lib/jobs/stale'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/cron/check-stale-jobs
 *
 * Marks jobs that n8n never returned (5 min per image, no output) as failed.
 * Triggered by the n8n workflow at the end of an edit run (Vercel Hobby caps
 * crons at once/day, so we don't use Vercel Cron). If CRON_SECRET is set, the
 * caller must send `Authorization: Bearer <CRON_SECRET>`.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const failed = await markStaleJobsFailed()
    return NextResponse.json({ success: true, failed })
  } catch (error) {
    console.error('❌ Stale-job cron failed:', error)
    return NextResponse.json({ error: 'Failed to run stale-job sweep' }, { status: 500 })
  }
}
