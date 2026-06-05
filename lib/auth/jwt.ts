import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import { ACCESS_TOKEN_TTL_SECONDS, type AuthUser } from './constants'

/**
 * Access-token signing/verification with `jose` (HS256).
 * Edge-compatible — safe to import from middleware.
 */

const encoder = new TextEncoder()

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_JWT_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_JWT_SECRET must be set and at least 32 characters long')
  }
  return encoder.encode(secret)
}

export interface AccessTokenClaims extends JWTPayload {
  sub: string
  email: string
  role: string
  isAdmin: boolean
  isSuperAdmin: boolean
}

export async function signAccessToken(user: AuthUser): Promise<string> {
  return new SignJWT({
    email: user.email,
    role: user.role,
    isAdmin: user.isAdmin,
    isSuperAdmin: user.isSuperAdmin,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(getSecret())
}

export async function verifyAccessToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ['HS256'] })
    if (!payload.sub || typeof payload.email !== 'string') return null
    return {
      id: payload.sub,
      email: payload.email,
      role: typeof payload.role === 'string' ? payload.role : 'user',
      isAdmin: payload.isAdmin === true,
      isSuperAdmin: payload.isSuperAdmin === true,
    }
  } catch {
    return null
  }
}
