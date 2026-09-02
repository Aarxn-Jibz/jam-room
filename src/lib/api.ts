export type Band = { id: string; name: string; colour: string }
export type ManagedUser = { id: string; name: string; email: string; role: 'user' | 'admin'; bands: Pick<Band, 'id' | 'name'>[] }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init)
  const body = await response.json().catch(() => null) as { error?: string; message?: string } | T | null
  if (!response.ok) {
    const failure = body as { error?: string; message?: string } | null
    throw new Error(failure?.message ?? failure?.error ?? 'Request failed')
  }
  return body as T
}

const json = (method: 'POST' | 'PUT' | 'PATCH', body: unknown): RequestInit => ({ method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })

export const api = {
  users: () => request<ManagedUser[]>('/api/users'),
  bands: () => request<Band[]>('/api/bands'),
  register: (body: { name: string; email: string; bandIds: string[] }) => request('/api/auth/register', json('POST', body)),
  updateUser: (id: string, body: { name: string; email: string; role: 'user' | 'admin'; bandIds: string[] }) => request(`/api/users?id=${encodeURIComponent(id)}`, json('PUT', body)),
  deleteUser: (id: string) => request(`/api/users?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),
  createBand: (body: { name: string; colour: string }) => request('/api/bands', json('POST', body)),
  updateBand: (id: string, body: { name: string; colour: string }) => request(`/api/bands?id=${encodeURIComponent(id)}`, json('PUT', body)),
  deleteBand: (id: string) => request(`/api/bands?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),
}
