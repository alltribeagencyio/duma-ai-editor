import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { pricingService } from '@/lib/pricing'

// GET /api/pricing/plans - Get all active pricing plans
export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const plans = await pricingService.getAllPlans()

    return NextResponse.json({ plans }, { status: 200 })
  } catch (error) {
    console.error('Error fetching pricing plans:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pricing plans' },
      { status: 500 }
    )
  }
}
