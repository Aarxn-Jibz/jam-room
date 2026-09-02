import { useState } from 'react'
import type { FormEvent } from 'react'

type Props = { open: boolean; onClose: () => void; onSuccess: (user: { id: string; name: string; role: 'user' | 'admin'; bands: { id: string; name: string }[] }) => void }

export function AuthModal({ open, onClose, onSuccess }: Props) {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false)
  if (!open) return null
  const submit = async (event: FormEvent) => { event.preventDefault(); setLoading(true); setError(''); try { const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) }); const data = await response.json() as { error?: string; user?: { id: string; name: string; role: 'user' | 'admin'; bands: { id: string; name: string }[] } }; if (!response.ok || !data.user) throw new Error(data.error ?? 'Unable to sign in'); onSuccess(data.user); onClose() } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to sign in') } finally { setLoading(false) } }
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><form className="auth-modal" onSubmit={submit} onMouseDown={event => event.stopPropagation()}><button className="modal-close" type="button" onClick={onClose} aria-label="Close">×</button><p className="eyebrow">JAMROOM</p><h2>Sign in</h2><label>Email<input required type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" /></label><label>Password<input required type="password" minLength={6} value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" /></label>{error && <p className="form-error">{error}</p>}<button className="form-submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button></form></div>
}
