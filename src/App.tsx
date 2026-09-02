import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { AuthModal } from './components/AuthModal'
import { RequestsScreen } from './components/RequestsScreen'
import { DashboardScreen } from './components/DashboardScreen'
import { RegisterScreen } from './components/RegisterScreen'
import { BookingRequestModal } from './components/BookingRequestModal'
import { PasswordChangeModal } from './components/PasswordChangeModal'

type Page = 'booking' | 'requests' | 'dashboard' | 'register'
type Room = { id: string; number: number; name?: string }
type SlotConfig = { id: string; start_time: string; end_time: string; enabled: boolean }
type Booking = { id: string; slot_start: string; slot_end: string; band_name?: string }
type SessionUser = { id: string; name: string; role: 'user' | 'admin'; bands: { id: string; name: string }[]; mustChangePassword?: boolean }
const fallbackSlots: SlotConfig[] = [{ id: '1', start_time: '09:00', end_time: '10:00', enabled: true }, { id: '2', start_time: '10:00', end_time: '11:00', enabled: true }, { id: '3', start_time: '11:00', end_time: '12:00', enabled: true }]
const mondayOf = (date: Date) => { const day = new Date(date); day.setDate(day.getDate() - (day.getDay() + 6) % 7); day.setHours(0, 0, 0, 0); return day }
const labelTime = (time: string) => new Date(`2000-01-01T${time}`).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
const dateKey = (date: Date) => date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

export default function App() {
  const [page, setPage] = useState<Page>('booking'); const [menuOpen, setMenuOpen] = useState(false)
  const [rooms, setRooms] = useState<Room[]>([]); const [roomNumber, setRoomNumber] = useState(365)
  const [slots, setSlots] = useState<SlotConfig[]>(fallbackSlots); const [bookings, setBookings] = useState<Booking[]>([])
  const [week, setWeek] = useState(() => mondayOf(new Date())); const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<string | null>(null); const [user, setUser] = useState<SessionUser | null>(null); const [loginOpen, setLoginOpen] = useState(false)
  const [selection, setSelection] = useState<{ date: Date; slot: SlotConfig } | null>(null)
  useEffect(() => { fetch('/api/auth/me').then(response => response.ok ? response.json() : null).then((data: SessionUser | null) => setUser(data)).catch(() => undefined) }, [])
  useEffect(() => { Promise.all([fetch('/api/rooms'), fetch('/api/slotconfig')]).then(async ([roomResponse, slotResponse]) => {
    if (roomResponse.ok) { const loaded = await roomResponse.json() as Room[]; setRooms(loaded); if (loaded.length) setRoomNumber(loaded[0].number) }
    if (slotResponse.ok) { const loaded = await slotResponse.json() as SlotConfig[]; if (loaded.length) setSlots(loaded.filter(slot => slot.enabled)) }
  }).catch(() => setNotice('Showing the booking layout while the local API is unavailable.')) }, [])
  useEffect(() => { const end = new Date(week); end.setDate(end.getDate() + 7); setLoading(true); fetch(`/api/slots?start=${encodeURIComponent(week.toISOString())}&end=${encodeURIComponent(end.toISOString())}&roomNumber=${roomNumber}`).then(response => response.ok ? response.json() : []).then((data: Booking[]) => setBookings(data)).catch(() => setBookings([])).finally(() => setLoading(false)) }, [roomNumber, week])
  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => { const day = new Date(week); day.setDate(day.getDate() + index); return day }), [week])
  const setView = (next: Page) => { setPage(next); setMenuOpen(false) }
  const bookingAt = (day: Date, slot: SlotConfig) => bookings.find(booking => { const start = new Date(booking.slot_start); return dateKey(start) === dateKey(day) && start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' }) === slot.start_time.slice(0, 5) })
  const logout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); setUser(null); setView('booking') }
  const selectSlot = (day: Date, slot: SlotConfig, booking: Booking | undefined) => { if (booking) return setNotice(`${booking.band_name ?? 'This room'} has already booked this slot.`); if (!user) setLoginOpen(true); else if (user.mustChangePassword) setNotice('Change your password before requesting a slot.'); else setSelection({ date: day, slot }) }
  return <div className="app">
    <header className="site-header">
      <button className="identity" onClick={() => setView('booking')} aria-label="Jamroom home"><span className="identity-mark">J</span><span>JAMROOM</span></button>
      <button className="menu-toggle" onClick={() => setMenuOpen(open => !open)} aria-expanded={menuOpen} aria-label="Toggle navigation"><i /><i /><i /></button>
      <nav className={menuOpen ? 'nav nav--open' : 'nav'}>
        {([['booking', 'Room Booking'], ['requests', 'Slot Requests'], ['dashboard', 'Dashboard'], ['register', 'Register']] as [Page, string][]).map(([key, label]) => <button key={key} className={page === key ? 'active' : ''} onClick={() => setView(key)}>{label}</button>)}
        <button className="login" onClick={user ? logout : () => setLoginOpen(true)}>{user ? 'Logout' : 'Login'}</button>
      </nav>
    </header>
    <main>{page === 'booking' ? <section className="booking-page">
      <div className="eyebrow">JAMROOM · MUSIC ROOM BOOKING</div>
      <div className="intro"><div><h1>Find your space.</h1><p>Browse room availability and request practice time for your band.</p></div><div className="availability"><span className="status-dot" /> Live availability<br /><small>Asia/Kolkata time</small></div></div>
      {notice && <div className="notice" role="status">{notice}<button onClick={() => setNotice(null)} aria-label="Dismiss">×</button></div>}
      <section className="schedule-card">
        <div className="schedule-toolbar"><label>ROOM <select value={roomNumber} onChange={event => setRoomNumber(Number(event.target.value))}>{rooms.length ? rooms.map(room => <option key={room.id} value={room.number}>Room {room.number}{room.name ? ` — ${room.name}` : ''}</option>) : <option value="365">Room 365</option>}</select></label>
          <div className="week-controls"><button onClick={() => setWeek(mondayOf(new Date()))}>Today</button><button aria-label="Previous week" onClick={() => setWeek(current => new Date(current.getFullYear(), current.getMonth(), current.getDate() - 7))}>‹</button><span>{week.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} – {days[6].toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span><button aria-label="Next week" onClick={() => setWeek(current => new Date(current.getFullYear(), current.getMonth(), current.getDate() + 7))}>›</button></div>
        </div>
        <div className="schedule-wrap" aria-busy={loading}>{loading && <div className="loading-line" />}<table className="schedule"><thead><tr><th>TIME</th>{days.map(day => <th key={day.toISOString()}><span>{day.toLocaleDateString('en-IN', { weekday: 'short' })}</span><b>{day.getDate()}</b></th>)}</tr></thead><tbody>{slots.map(slot => <tr key={slot.id}><th><b>{labelTime(slot.start_time)}</b><span>{labelTime(slot.end_time)}</span></th>{days.map(day => { const booking = bookingAt(day, slot); return <td key={`${slot.id}-${day.toISOString()}`}><button className={booking ? 'slot slot--booked' : 'slot'} onClick={() => selectSlot(day, slot, booking)}>{booking ? (booking.band_name ?? 'Booked') : <><span>Available</span><em>Request slot</em></>}</button></td> })}</tr>)}</tbody></table></div>
        <footer className="schedule-footer"><span><i className="legend available" /> Available</span><span><i className="legend booked" /> Reserved</span><span>Room {roomNumber} · Select an available slot to request it</span></footer>
      </section>
    </section> : page === 'requests' ? <RequestsScreen signedIn={Boolean(user)} /> : page === 'dashboard' ? <DashboardScreen admin={user?.role === 'admin'} /> : <RegisterScreen admin={user?.role === 'admin'} />}</main>
    <AuthModal open={loginOpen} onClose={() => setLoginOpen(false)} onSuccess={setUser} />
    <PasswordChangeModal open={Boolean(user?.mustChangePassword)} onChanged={() => setUser(current => current ? { ...current, mustChangePassword: false } : current)} />
    <BookingRequestModal open={Boolean(selection)} onClose={() => setSelection(null)} date={selection?.date ?? null} startTime={selection?.slot.start_time ?? ''} endTime={selection?.slot.end_time ?? ''} roomId={rooms.find(room => room.number === roomNumber)?.id} user={user} onCreated={() => { setNotice('Your booking request was submitted.'); setWeek(new Date(week)) }} />
  </div>
}
