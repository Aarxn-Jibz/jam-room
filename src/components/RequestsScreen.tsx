import { useEffect, useState } from 'react'

type Request = { id: string; status: 'pending' | 'approved' | 'denied'; slot_start: string; slot_end: string; band_name?: string; reason?: string; room_id: string }
export function RequestsScreen({ signedIn }: { signedIn: boolean }) {
  const [items, setItems] = useState<Request[]>([]); const [message, setMessage] = useState('')
  useEffect(() => { if (!signedIn) return; fetch('/api/requests').then(response => response.ok ? response.json() : Promise.reject()).then(setItems).catch(() => setMessage('Unable to load requests.')) }, [signedIn])
  if (!signedIn) return <section className="coming-soon"><div className="eyebrow">JAMROOM</div><h1>Slot Requests</h1><p>Please sign in to see and manage your booking requests.</p></section>
  return <section className="content-page"><div className="eyebrow">JAMROOM · YOUR ACTIVITY</div><h1>Slot Requests</h1>{message && <p className="form-error">{message}</p>}<div className="data-list">{items.length ? items.map(item => <article key={item.id}><div><b>{item.band_name ?? 'Booking request'}</b><span>{new Date(item.slot_start).toLocaleString('en-IN')} – {new Date(item.slot_end).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}</span>{item.reason && <small>{item.reason}</small>}</div><em className={`state state--${item.status}`}>{item.status}</em></article>) : <p className="empty">No booking requests yet.</p>}</div></section>
}
