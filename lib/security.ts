/**
 * Security utilities for data sanitization and validation
 */

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (!input) return ''

  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate phone number (basic international format)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/
  return phoneRegex.test(phone.replace(/[\s()-]/g, ''))
}

/**
 * Validate URL
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Sanitize file name to prevent directory traversal
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace unsafe characters
    .replace(/\.{2,}/g, '.') // Remove multiple dots
    .substring(0, 255) // Limit length
}

/**
 * Validate file type against allowed types
 */
export function isAllowedFileType(
  fileName: string,
  allowedTypes: string[] = ['jpg', 'jpeg', 'png', 'webp', 'heic']
): boolean {
  const extension = fileName.split('.').pop()?.toLowerCase()
  return extension ? allowedTypes.includes(extension) : false
}

/**
 * Validate file size
 */
export function isValidFileSize(size: number, maxSizeMB: number = 5): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return size > 0 && size <= maxSizeBytes
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  const randomValues = new Uint8Array(length)

  if (typeof window !== 'undefined') {
    window.crypto.getRandomValues(randomValues)
  } else {
    // Server-side
    const crypto = require('crypto')
    crypto.randomFillSync(randomValues)
  }

  for (let i = 0; i < length; i++) {
    token += chars[randomValues[i] % chars.length]
  }

  return token
}

/**
 * Hash sensitive data (for logging, not for passwords)
 */
export function hashForLogging(data: string): string {
  if (!data) return ''

  if (typeof window !== 'undefined') {
    // Client-side: just mask
    return data.substring(0, 4) + '****' + data.substring(data.length - 4)
  } else {
    // Server-side: use crypto
    const crypto = require('crypto')
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16)
  }
}

/**
 * Validate and sanitize prompt input
 */
export function sanitizePrompt(prompt: string, maxLength: number = 1000): string {
  if (!prompt) return ''

  return prompt
    .trim()
    .substring(0, maxLength)
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/\0/g, '') // Remove null bytes
}

/**
 * Check for SQL injection patterns (basic)
 */
export function hasSqlInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(--|\;|\/\*|\*\/)/g,
    /(\bOR\b.*=.*)/gi,
    /(\bAND\b.*=.*)/gi,
  ]

  return sqlPatterns.some(pattern => pattern.test(input))
}

/**
 * Rate limit key generator
 */
export function getRateLimitKey(identifier: string, action: string): string {
  return `ratelimit:${action}:${identifier}`
}

/**
 * Mask sensitive data for display
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email

  const [local, domain] = email.split('@')
  const maskedLocal = local.length > 2
    ? local[0] + '****' + local[local.length - 1]
    : '****'

  return `${maskedLocal}@${domain}`
}

export function maskPhone(phone: string): string {
  if (!phone || phone.length < 4) return '****'

  return '****' + phone.substring(phone.length - 4)
}

export function maskCard(card: string): string {
  if (!card || card.length < 4) return '****'

  return '**** **** **** ' + card.substring(card.length - 4)
}
