'use client'

import { useEffect } from 'react'

/**
 * Silent session refresh.
 *
 * Patches the browser's fetch so that when any same-origin /api call returns 401
 * (expired access token), we call /api/auth/refresh once (using the refresh
 * cookie), then retry the original request. If refresh fails, the session is
 * truly over → send the user to /login.
 *
 * Excludes /api/auth/* so refresh/login/logout themselves are never intercepted
 * (prevents loops).
 */
export function AuthRefreshProvider() {
  useEffect(() => {
    const originalFetch = window.fetch.bind(window)
    let refreshPromise: Promise<boolean> | null = null

    function refreshOnce(): Promise<boolean> {
      if (!refreshPromise) {
        refreshPromise = originalFetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        })
          .then((r) => r.ok)
          .catch(() => false)
          .finally(() => {
            // Allow a new refresh on the next 401 after this one settles.
            setTimeout(() => {
              refreshPromise = null
            }, 0)
          })
      }
      return refreshPromise
    }

    function urlOf(input: RequestInfo | URL): string {
      if (typeof input === 'string') return input
      if (input instanceof URL) return input.toString()
      if (input instanceof Request) return input.url
      return String(input)
    }

    const patched: typeof window.fetch = async (input, init) => {
      const res = await originalFetch(input, init)

      const url = urlOf(input)
      const isApi = url.includes('/api/') && !url.includes('/api/auth/')

      if (res.status !== 401 || !isApi) return res

      const refreshed = await refreshOnce()
      if (refreshed) {
        // Retry the original request with a fresh access cookie.
        return originalFetch(input, init)
      }

      // Refresh failed → session expired for real.
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
      return res
    }

    window.fetch = patched
    return () => {
      window.fetch = originalFetch
    }
  }, [])

  return null
}
