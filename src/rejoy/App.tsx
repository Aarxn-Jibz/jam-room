import { useEffect } from 'react'
import { AuthProvider } from './lib/auth'
import ForcePasswordChange from './components/ui/ForcePasswordChange'
import RoomBooking from './pages/RoomBooking'
import SlotRequests from './pages/SlotRequests'
import Dashboard from './pages/Dashboard'
import Register from './pages/Register'
import Home from './pages/Home'

function Route() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  useEffect(() => {
    if (path === '/') window.history.replaceState(null, '', '/RoomBooking')
  }, [path])
  if (path === '/' || path === '/RoomBooking') return <RoomBooking />
  if (path === '/SlotRequests') return <SlotRequests />
  if (path === '/Dashboard') return <Dashboard />
  if (path === '/Register') return <Register />
  if (path === '/home') return <Home />
  return <RoomBooking />
}

export default function RejoyApp() {
  useEffect(() => { document.documentElement.classList.add('dark') }, [])
  return <AuthProvider><Route /><ForcePasswordChange /></AuthProvider>
}
