'use client'

/**
 * Compatibility layer (formerly Supabase browser client).
 *
 * Supabase Auth has been replaced by native JWT auth (see lib/auth/* and
 * /api/auth/*). Existing client components call `createClient().auth.getUser()`
 * and `.auth.signOut()`; those are mapped to the new /api/auth endpoints here.
 */

interface CompatUser {
  id: string
  email: string
  user_metadata?: Record<string, unknown>
}

async function getUser(): Promise<{ data: { user: CompatUser | null }; error: null }> {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' })
    if (!res.ok) return { data: { user: null }, error: null }
    const { user } = await res.json()
    return {
      data: { user: user ? { id: user.id, email: user.email, user_metadata: {} } : null },
      error: null,
    }
  } catch {
    return { data: { user: null }, error: null }
  }
}

async function signOut(): Promise<{ error: null }> {
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
  } catch {
    /* ignore */
  }
  return { error: null }
}

export function createClient() {
  return {
    auth: {
      getUser,
      getSession: async () => {
        const { data } = await getUser()
        return { data: { session: data.user ? { user: data.user } : null }, error: null }
      },
      signOut,
    },
  }
}
