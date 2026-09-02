import { useEffect, useState } from 'react'
type Slot = { id: string; start_time: string; end_time: string; enabled: boolean }
export function DashboardScreen({ admin }: { admin: boolean }) {
  const [slots, setSlots] = useState<Slot[]>([]); const [start, setStart] = useState('09:00'); const [end, setEnd] = useState('10:00'); const [message, setMessage] = useState('')
  const load = () => { if (admin) fetch('/api/slotconfig').then(response => response.ok ? response.json() : []).then(setSlots).catch(() => setMessage('Unable to load slot configuration.')) }
  useEffect(load, [admin])
  const add = async () => { const response = await fetch('/api/slotconfig', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ start_time: start, end_time: end }) }); if (!response.ok) setMessage('Unable to add slot.'); else load() }
  const remove = async (id: string) => { const response = await fetch(`/api/slotconfig?id=${id}`, { method: 'DELETE' }); if (!response.ok) setMessage('Unable to delete slot.'); else load() }
  if (!admin) return <section className="coming-soon"><div className="eyebrow">JAMROOM</div><h1>Dashboard</h1><p>This page is available to Jamroom administrators.</p></section>
  return <section className="content-page"><div className="eyebrow">JAMROOM · ADMINISTRATION</div><h1>Dashboard</h1><div className="admin-form"><h2>Booking slots</h2><label>Start<input type="time" value={start} onChange={event => setStart(event.target.value)} /></label><label>End<input type="time" value={end} onChange={event => setEnd(event.target.value)} /></label><button className="form-submit" onClick={add}>Add slot</button>{message && <p className="form-error">{message}</p>}<div className="data-list">{slots.map(slot => <article key={slot.id}><span>{slot.start_time} – {slot.end_time}</span><button onClick={() => remove(slot.id)}>Delete</button></article>)}</div></div></section>
}
