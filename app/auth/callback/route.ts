import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient()

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('Auth callback error:', error)
        return NextResponse.redirect(new URL('/login?error=auth_failed', requestUrl.origin))
      }

      if (data.user) {
        // Create or update user profile in database
        try {
          await prisma.user.upsert({
            where: { id: data.user.id },
            update: {
              email: data.user.email!,
              lastLoginAt: new Date()
            },
            create: {
              id: data.user.id,
              email: data.user.email!,
              fullName: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || '',
              subscriptionTier: 'free',
              subscriptionStatus: 'active',
              pricingPlan: 'personal',
              creditBalance: 0,
              hasCompletedInitialPurchase: false,
              monthlyCredits: 0,
              practiceCredits: 0,
              creditsUsed: 0,
              hasCompletedOnboarding: true,
              notificationsEmail: true,
              notificationsWhatsApp: false,
              setupFeesPaid: false
            }
          })

          console.log('User profile created/updated for:', data.user.email)
        } catch (dbError) {
          console.error('Database error during auth callback:', dbError)
          // Continue with redirect even if DB operation fails
        }

        // Redirect to dashboard
        return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
      }
    } catch (error) {
      console.error('Session exchange error:', error)
      return NextResponse.redirect(new URL('/login?error=session_failed', requestUrl.origin))
    }
  }

  // Fallback redirect
  return NextResponse.redirect(new URL('/login', requestUrl.origin))
}