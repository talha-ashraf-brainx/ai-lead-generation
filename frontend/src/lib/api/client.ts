const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isFormData = init.body instanceof FormData

  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...init,
    headers: isFormData ? init.headers : { 'Content-Type': 'application/json', ...init.headers },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new ApiError(response.status, body?.error?.message ?? response.statusText)
  }
  if (response.status === 204) return undefined as T
  return response.json()
}

export function isNotFound(err: unknown): boolean {
  return err instanceof ApiError && err.status === 404
}

export function buildQuery(params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value))
  })
  const qs = query.toString()
  return qs ? `?${qs}` : ''
}
