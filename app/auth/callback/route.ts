import { NextRequest, NextResponse } from 'next/server'

/**
 * Legacy Supabase OAuth/email-confirmation callback.
 * Native JWT auth no longer uses this flow; redirect any stragglers to login.
 */
export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL('/login', new URL(req.url).origin))
}
