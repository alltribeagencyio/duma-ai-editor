/**
 * Edge-safe auth constants (no Node-only imports — usable from middleware).
 */

export const ACCESS_COOKIE = 'duma_access'
export const REFRESH_COOKIE = 'duma_refresh'

export const ACCESS_TOKEN_TTL_SECONDS = 60 * 15 // 15 minutes
export const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days

export interface AuthUser {
  id: string
  email: string
  role: string
  isAdmin: boolean
  isSuperAdmin: boolean
}

export function authCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  }
}
