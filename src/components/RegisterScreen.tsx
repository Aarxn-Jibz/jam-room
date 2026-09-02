import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
type Band = { id: string; name: string }
export function RegisterScreen({ admin }: { admin: boolean }) {
  const [bands, setBands] = useState<Band[]>([]); const [message, setMessage] = useState(''); const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [bandId, setBandId] = useState('')
  useEffect(() => { fetch('/api/bands').then(response => response.ok ? response.json() : []).then(setBands).catch(() => undefined) }, [])
  if (!admin) return <section className="coming-soon"><div className="eyebrow">JAMROOM</div><h1>Register</h1><p>This page is available to Jamroom administrators.</p></section>
  const submit = async (event: FormEvent) => { event.preventDefault(); setMessage(''); const response = await fetch('/api/auth/register', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name, email, bandIds: bandId ? [bandId] : [] }) }); setMessage(response.ok ? 'User registered. They will be asked to change their password on sign-in.' : 'Unable to register this user.') }
  return <section className="content-page"><div className="eyebrow">JAMROOM · ADMINISTRATION</div><h1>Register user</h1><form className="admin-form" onSubmit={submit}><label>Name<input required value={name} onChange={event => setName(event.target.value)} /></label><label>Email<input required type="email" value={email} onChange={event => setEmail(event.target.value)} /></label><label>Band<select value={bandId} onChange={event => setBandId(event.target.value)}><option value="">No band</option>{bands.map(band => <option key={band.id} value={band.id}>{band.name}</option>)}</select></label><button className="form-submit">Register user</button>{message && <p>{message}</p>}</form></section>
}
