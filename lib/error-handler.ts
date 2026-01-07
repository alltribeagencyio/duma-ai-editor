export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function handleApiError(error: any): AppError {
  // Network errors
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return new AppError(
      'Unable to connect to the server. Please check your internet connection.',
      'NETWORK_ERROR',
      0
    )
  }

  // API response errors
  if (error.response) {
    const { status, data } = error.response

    switch (status) {
      case 400:
        return new AppError(
          data.message || 'Invalid request. Please check your input.',
          'BAD_REQUEST',
          400,
          data
        )
      case 401:
        return new AppError(
          'You are not authenticated. Please sign in again.',
          'UNAUTHORIZED',
          401
        )
      case 403:
        return new AppError(
          'You don&apos;t have permission to perform this action.',
          'FORBIDDEN',
          403
        )
      case 404:
        return new AppError(
          'The requested resource was not found.',
          'NOT_FOUND',
          404
        )
      case 429:
        return new AppError(
          'Too many requests. Please try again later.',
          'RATE_LIMIT',
          429
        )
      case 500:
        return new AppError(
          'Server error. Our team has been notified.',
          'SERVER_ERROR',
          500
        )
      case 503:
        return new AppError(
          'Service temporarily unavailable. Please try again later.',
          'SERVICE_UNAVAILABLE',
          503
        )
      default:
        return new AppError(
          data.message || 'An unexpected error occurred.',
          'UNKNOWN_ERROR',
          status,
          data
        )
    }
  }

  // Generic errors
  if (error instanceof AppError) {
    return error
  }

  return new AppError(
    error.message || 'An unexpected error occurred.',
    'UNKNOWN_ERROR'
  )
}

export async function fetchWithErrorHandling<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, options)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }))
      throw handleApiError({
        response: {
          status: response.status,
          data: error
        }
      })
    }

    return await response.json()
  } catch (error) {
    throw handleApiError(error)
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'An unexpected error occurred'
}

export function isNetworkError(error: unknown): boolean {
  return error instanceof AppError && error.code === 'NETWORK_ERROR'
}

export function isAuthError(error: unknown): boolean {
  return error instanceof AppError && (error.code === 'UNAUTHORIZED' || error.code === 'FORBIDDEN')
}
