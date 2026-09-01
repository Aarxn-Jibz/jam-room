import { useEffect, useState } from 'react'
import './App.css'

type View = 'booking' | 'requests' | 'admin'
const rows = [['09:00 – 10:00', 'Available', 'Choir', 'Available'], ['10:00 – 11:00', 'Natyarpana', 'Available', 'Available']]

export default function App() {
  const [view, setView] = useState<View>('booking')
  const [compact, setCompact] = useState(() => window.innerWidth <= 640)
  const [menuOpen, setMenuOpen] = useState(false)
  const [status, setStatus] = useState('Checking…')
  useEffect(() => { const update = () => setCompact(window.innerWidth <= 640); window.addEventListener('resize', update); return () => window.removeEventListener('resize', update) }, [])
  useEffect(() => { fetch('/api/health').then(r => setStatus(r.ok ? 'Online' : 'Unavailable')).catch(() => setStatus('Unavailable')) }, [])
  const select = (next: View) => { setView(next); setMenuOpen(false) }
  const nav = <>{(['booking', 'requests', 'admin'] as View[]).map(item => <button key={item} onClick={() => select(item)}>{item}</button>)}</>
  return <main className="app-shell"><header><button className="brand" onClick={() => select('booking')}>Jamroom <b>CKC</b></button>{compact ? <><button className="menu" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>☰</button>{menuOpen && <nav className="mobile-nav">{nav}</nav>}</> : <nav>{nav}</nav>}</header><section className="heading"><small>Music room management</small><h1>{view === 'booking' ? 'Book a room' : view === 'requests' ? 'Your requests' : 'Administration'}</h1><p>API: {status}</p></section>{view === 'booking' && (compact ? <div className="cards">{rows.map(row => <article key={row[0]}><h2>{row[0]}</h2>{['Mon', 'Tue', 'Wed'].map((day, index) => <button className={row[index + 1] === 'Available' ? 'available' : 'booked'} key={day}>{day}: {row[index + 1]}</button>)}</article>)}</div> : <div className="table"><table><thead><tr><th>Time</th><th>Mon</th><th>Tue</th><th>Wed</th></tr></thead><tbody>{rows.map(row => <tr key={row[0]}>{row.map((value, index) => index ? <td key={value}>{value}</td> : <th key={value}>{value}</th>)}</tr>)}</tbody></table></div>)}{view !== 'booking' && <article className="panel">Original feature source is preserved in <code>legacy/</code> and ready for native Hono/React conversion.</article>}</main>
}
