/**
 * Compatibility layer (formerly Supabase server client).
 *
 * Supabase Auth has been replaced by native JWT auth (see lib/auth/*).
 * This module preserves the old call sites — `createClient()` /
 * `createRouteHandlerClient()` returning an object with `auth.getUser()` —
 * so server components and API routes keep working while reading the
 * authenticated user from the access-token cookie.
 */
import { getCurrentUser } from '@/lib/auth/session'

interface CompatUser {
  id: string
  email: string
}

async function getUser(): Promise<{ data: { user: CompatUser | null }; error: null }> {
  const user = await getCurrentUser()
  return {
    data: { user: user ? { id: user.id, email: user.email } : null },
    error: null,
  }
}

const compatClient = {
  auth: {
    getUser,
    // Legacy session shape; only `user` is consumed anywhere.
    getSession: async () => {
      const { data } = await getUser()
      return { data: { session: data.user ? { user: data.user } : null }, error: null }
    },
  },
}

export function createClient() {
  return compatClient
}

export function createRouteHandlerClient() {
  return compatClient
}
