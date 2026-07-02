import axios from 'axios'

// In dev, Vite proxies /api -> localhost:8000. In production the SPA and API
// share an origin on Vercel, so a relative baseURL works in both cases.
// VITE_API_URL can override this (e.g. to point at a separate backend host).
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
})

export interface HealthResponse {
  status: string
}

export async function getHealth(): Promise<HealthResponse> {
  const { data } = await api.get<HealthResponse>('/health/')
  return data
}
