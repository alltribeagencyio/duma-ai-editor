import 'server-only'
import { cookies } from 'next/headers'
import { createHash, randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { signAccessToken, verifyAccessToken } from './jwt'
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
  authCookieOptions,
  type AuthUser,
} from './constants'

export type { AuthUser }

interface UserRecord {
  id: string
  email: string
  role: string
  isAdmin: boolean
  isSuperAdmin: boolean
}

interface SessionMeta {
  userAgent?: string | null
  ipAddress?: string | null
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function toAuthUser(u: UserRecord): AuthUser {
  return {
    id: u.id,
    email: u.email,
    role: u.role,
    isAdmin: u.isAdmin,
    isSuperAdmin: u.isSuperAdmin,
  }
}

function setAuthCookies(accessToken: string, refreshToken: string): void {
  const store = cookies()
  store.set(ACCESS_COOKIE, accessToken, authCookieOptions(ACCESS_TOKEN_TTL_SECONDS))
  store.set(REFRESH_COOKIE, refreshToken, authCookieOptions(REFRESH_TOKEN_TTL_SECONDS))
}

export function clearAuthCookies(): void {
  const store = cookies()
  store.set(ACCESS_COOKIE, '', authCookieOptions(0))
  store.set(REFRESH_COOKIE, '', authCookieOptions(0))
}

/** Create a refresh session (DB) + access token and set both cookies. */
export async function issueSession(user: UserRecord, meta?: SessionMeta): Promise<void> {
  const accessToken = await signAccessToken(toAuthUser(user))
  const refreshToken = randomBytes(48).toString('base64url')

  await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
      userAgent: meta?.userAgent ?? undefined,
      ipAddress: meta?.ipAddress ?? undefined,
    },
  })

  setAuthCookies(accessToken, refreshToken)
}

/**
 * Validate the current refresh cookie, rotate it (revoke old, issue new),
 * and set fresh cookies. Returns the user, or null if the refresh token is invalid.
 */
export async function rotateSession(meta?: SessionMeta): Promise<AuthUser | null> {
  const refreshToken = cookies().get(REFRESH_COOKIE)?.value
  if (!refreshToken) return null

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(refreshToken) },
  })

  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, role: true, isAdmin: true, isSuperAdmin: true },
  })
  if (!user) return null

  // Rotate: revoke the consumed token, then issue a new session.
  await prisma.session.update({
    where: { id: session.id },
    data: { revokedAt: new Date() },
  })

  await issueSession(user, meta)
  return toAuthUser(user)
}

/** Revoke the current refresh session (logout) and clear cookies. */
export async function endSession(): Promise<void> {
  const refreshToken = cookies().get(REFRESH_COOKIE)?.value
  if (refreshToken) {
    await prisma.session
      .updateMany({
        where: { tokenHash: hashToken(refreshToken) },
        data: { revokedAt: new Date() },
      })
      .catch(() => {})
  }
  clearAuthCookies()
}

/**
 * The authenticated user for the current request, derived from the access-token
 * cookie. Returns null when unauthenticated. (Replaces supabase.auth.getUser().)
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = cookies().get(ACCESS_COOKIE)?.value
  if (!token) return null
  return verifyAccessToken(token)
}

/** Convenience guard: returns the user or throws a 401-style sentinel. */
export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('UNAUTHORIZED')
  }
  return user
}
