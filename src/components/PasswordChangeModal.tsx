import { useState } from 'react'
type Props = { open: boolean; onChanged: () => void }
export function PasswordChangeModal({ open, onChanged }: Props) {
  const [currentPassword, setCurrentPassword] = useState(''); const [newPassword, setNewPassword] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false)
  if (!open) return null
  const submit = async () => { setBusy(true); setMessage(''); const response = await fetch('/api/auth/me/password', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ currentPassword, newPassword }) }); const data = await response.json().catch(() => ({})) as { error?: string }; setBusy(false); if (!response.ok) return setMessage(data.error ?? 'Unable to change password.'); onChanged() }
  return <div className="modal-backdrop"><div className="auth-modal" role="dialog" aria-modal="true"><p className="eyebrow">SECURITY REQUIRED</p><h2>Change your password</h2><p className="modal-time">You must set a new password before using Jamroom.</p><label>Current password<input type="password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} /></label><label>New password<input type="password" minLength={6} value={newPassword} onChange={event => setNewPassword(event.target.value)} /></label>{message && <p className="form-error">{message}</p>}<button className="form-submit" disabled={busy || newPassword.length < 6} onClick={submit}>{busy ? 'Saving…' : 'Save new password'}</button></div></div>
}
