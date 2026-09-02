import { useEffect, useState } from 'react'
type Summary = { users: number; bands: number; slots: number }
export function DashboardScreen({ admin }: { admin: boolean }) {
  const [summary, setSummary] = useState<Summary | null>(null)
  useEffect(() => { if (!admin) return; Promise.all([fetch('/api/users'), fetch('/api/bands'), fetch('/api/slotconfig')]).then(async responses => ({ users: (await responses[0].json()).length, bands: (await responses[1].json()).length, slots: (await responses[2].json()).length })).then(setSummary).catch(() => undefined) }, [admin])
  if (!admin) return <section className="coming-soon"><div className="eyebrow">JAMROOM</div><h1>Dashboard</h1><p>This page is available to Jamroom administrators.</p></section>
  return <section className="content-page"><div className="eyebrow">JAMROOM · ADMINISTRATION</div><h1>Dashboard</h1><div className="stat-grid"><article><span>Users</span><b>{summary?.users ?? '—'}</b></article><article><span>Bands</span><b>{summary?.bands ?? '—'}</b></article><article><span>Active slots</span><b>{summary?.slots ?? '—'}</b></article></div><p className="empty">Administration APIs for users, bands, slot configuration, and settings are available through this same Worker.</p></section>
}
