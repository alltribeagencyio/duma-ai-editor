import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { pricingService } from '@/lib/pricing'

// GET /api/credits/balance - Get user's credit balance and info
export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const creditInfo = await pricingService.getUserCreditInfo(user.id)

    return NextResponse.json({ ...creditInfo }, { status: 200 })
  } catch (error) {
    console.error('Error fetching credit balance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch credit balance' },
      { status: 500 }
    )
  }
}
