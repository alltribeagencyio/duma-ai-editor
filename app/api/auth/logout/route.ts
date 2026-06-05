import { NextResponse } from 'next/server'
import { endSession } from '@/lib/auth/session'

export const runtime = 'nodejs'

// POST /api/auth/logout
export async function POST() {
  try {
    await endSession()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ success: true })
  }
}
