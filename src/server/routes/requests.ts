import { and, desc, eq, gt, inArray, lt } from 'drizzle-orm'
import { Hono } from 'hono'
import { createRequestSchema, updateRequestSchema } from '../schemas.js'
import { getDb, schema } from '../db/client.js'
import { authenticated } from './auth.js'

type Bindings = { DB: D1Database; JWT_SECRET?: string }
const requestRoutes = new Hono<{ Bindings: Bindings }>()
const activeStatuses = ['PENDING', 'APPROVED'] as const
const apiStatus = (status: string) => status === 'APPROVED' ? 'approved' : status === 'PENDING' ? 'pending' : 'denied'
const audit = (db: ReturnType<typeof getDb>, actorId: string, action: string, targetId: string, metadata: unknown) => db.insert(schema.auditLogs).values({ id: crypto.randomUUID(), actorId, action, targetType: 'BOOKING', targetId, metadata: JSON.stringify(metadata), createdAt: Date.now() })

async function requireUser(c: { env: Bindings; req: { header(name: string): string | undefined } }) { const auth = await authenticated(c); return auth && !auth.user.mustChangePassword ? auth : null }
async function serialize(db: ReturnType<typeof getDb>, id: string) {
  const row = (await db.select({ id: schema.bookings.id, user_id: schema.bookings.userId, room_id: schema.bookings.roomId, status: schema.bookings.status, slot_start: schema.bookings.startTime, slot_end: schema.bookings.endTime, request_date: schema.bookings.createdAt, response_date: schema.bookings.approvedAt, reason: schema.bookings.reason, user_name: schema.users.name, band_name: schema.profiles.name }).from(schema.bookings).innerJoin(schema.users, eq(schema.bookings.userId, schema.users.id)).innerJoin(schema.profiles, eq(schema.bookings.profileId, schema.profiles.id)).where(eq(schema.bookings.id, id)).limit(1))[0]
  return row && { ...row, status: apiStatus(row.status), slot_start: new Date(row.slot_start).toISOString(), slot_end: new Date(row.slot_end).toISOString(), request_date: new Date(row.request_date).toISOString(), response_date: row.response_date ? new Date(row.response_date).toISOString() : null }
}

requestRoutes.get('/requests', async c => {
  const auth = await requireUser(c); if (!auth) return c.json({ error: 'Unauthorized' }, 401)
  const db = getDb(c.env.DB); const roomId = c.req.query('room_id'); const suppliedUserId = c.req.query('user_id'); const userId = auth.user.role === 'ADMIN' ? suppliedUserId : auth.user.id
  const conditions = [roomId ? eq(schema.bookings.roomId, roomId) : undefined, userId ? eq(schema.bookings.userId, userId) : undefined].filter(Boolean)
  const rows = await db.select({ id: schema.bookings.id, user_id: schema.bookings.userId, room_id: schema.bookings.roomId, status: schema.bookings.status, slot_start: schema.bookings.startTime, slot_end: schema.bookings.endTime, request_date: schema.bookings.createdAt, response_date: schema.bookings.approvedAt, reason: schema.bookings.reason, user_name: schema.users.name, band_name: schema.profiles.name }).from(schema.bookings).innerJoin(schema.users, eq(schema.bookings.userId, schema.users.id)).innerJoin(schema.profiles, eq(schema.bookings.profileId, schema.profiles.id)).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(schema.bookings.createdAt))
  return c.json(rows.map(row => ({ ...row, status: apiStatus(row.status), slot_start: new Date(row.slot_start).toISOString(), slot_end: new Date(row.slot_end).toISOString(), request_date: new Date(row.request_date).toISOString(), response_date: row.response_date ? new Date(row.response_date).toISOString() : null })))
})

requestRoutes.post('/requests', async c => {
  const auth = await requireUser(c); if (!auth) return c.json({ error: 'Unauthorized' }, 401)
  const parsed = createRequestSchema.safeParse(await c.req.json().catch(() => ({}))); if (!parsed.success) return c.json({ message: 'Validation failed' }, 400)
  const input = parsed.data; const start = Date.parse(input.slot_start); const end = Date.parse(input.slot_end)
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || start <= Date.now()) return c.json({ message: 'Invalid future slot' }, 400)
  if (auth.user.role !== 'ADMIN' && input.user_id !== auth.user.id) return c.json({ message: 'Forbidden' }, 403)
  const db = getDb(c.env.DB); const room = (await db.select().from(schema.rooms).where(and(eq(schema.rooms.id, input.room_id), eq(schema.rooms.active, true))).limit(1))[0]
  const profile = (await db.select().from(schema.profiles).where(and(eq(schema.profiles.id, input.band_id), eq(schema.profiles.active, true))).limit(1))[0]
  if (!room || !profile) return c.json({ message: 'Room or band does not exist' }, 400)
  if (auth.user.role !== 'ADMIN') { const member = (await db.select().from(schema.userProfiles).where(and(eq(schema.userProfiles.userId, auth.user.id), eq(schema.userProfiles.profileId, input.band_id))).limit(1))[0]; if (!member) return c.json({ message: 'User does not belong to this band' }, 403) }
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(start)); const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; const startTime = `${parts.find(part => part.type === 'hour')?.value}:${parts.find(part => part.type === 'minute')?.value}`; const weekday = dayNames.indexOf(parts.find(part => part.type === 'weekday')?.value ?? '')
  const configured = (await db.select().from(schema.operatingSchedules).where(eq(schema.operatingSchedules.enabled, true))).some(slot => slot.dayOfWeek === weekday && slot.startTime.slice(0, 5) === startTime && end - start === (Date.parse(`1970-01-01T${slot.endTime}:00Z`) - Date.parse(`1970-01-01T${slot.startTime}:00Z`)))
  if (!configured) return c.json({ message: 'Slot is not available for booking' }, 400)
  const conflict = (await db.select({ id: schema.bookings.id, band: schema.profiles.name }).from(schema.bookings).innerJoin(schema.profiles, eq(schema.bookings.profileId, schema.profiles.id)).where(and(eq(schema.bookings.roomId, room.id), inArray(schema.bookings.status, activeStatuses), lt(schema.bookings.startTime, end), gt(schema.bookings.endTime, start))).limit(1))[0]
  if (conflict) return c.json({ message: `This time slot is already booked by ${conflict.band}.`, band_name: conflict.band }, 409)
  const id = crypto.randomUUID(); const now = Date.now(); await db.insert(schema.bookings).values({ id, roomId: room.id, profileId: input.band_id, userId: input.user_id, startTime: start, endTime: end, status: 'PENDING', reason: input.reason ?? null, createdAt: now }); await audit(db, auth.user.id, 'CREATE_BOOKING', id, { roomId: room.id, profileId: input.band_id, startTime: start, endTime: end }); return c.json(await serialize(db, id), 201)
})

requestRoutes.put('/requests', async c => {
  const auth = await requireUser(c); if (!auth) return c.json({ error: 'Unauthorized' }, 401); const id = c.req.query('id'); if (!id) return c.json({ message: 'Missing request id' }, 400)
  const parsed = updateRequestSchema.safeParse(await c.req.json().catch(() => ({}))); if (!parsed.success) return c.json({ message: 'Validation failed' }, 400); const db = getDb(c.env.DB); const booking = (await db.select().from(schema.bookings).where(eq(schema.bookings.id, id)).limit(1))[0]; if (!booking) return c.json({ message: 'Request not found' }, 404)
  if (auth.user.role !== 'ADMIN' && booking.userId !== auth.user.id) return c.json({ message: 'Forbidden' }, 403); const data = parsed.data
  if (auth.user.role !== 'ADMIN' && Object.keys(data).some(key => key !== 'reason')) return c.json({ message: 'Users may only edit their request reason' }, 403)
  await db.update(schema.bookings).set({ reason: data.reason ?? booking.reason, ...(auth.user.role === 'ADMIN' && data.status ? { status: data.status === 'approved' ? 'APPROVED' : data.status === 'denied' ? 'REJECTED' : 'PENDING', approvedBy: data.status === 'approved' ? auth.user.id : null, approvedAt: data.status === 'approved' ? Date.now() : null } : {}) }).where(eq(schema.bookings.id, id)); await audit(db, auth.user.id, 'UPDATE_BOOKING', id, data); return c.json({ message: 'Request updated', request: await serialize(db, id) })
})

requestRoutes.delete('/requests', async c => { const auth = await requireUser(c); if (!auth) return c.json({ error: 'Unauthorized' }, 401); const id = c.req.query('id'); if (!id) return c.json({ message: 'Missing request id' }, 400); const db = getDb(c.env.DB); const booking = (await db.select().from(schema.bookings).where(eq(schema.bookings.id, id)).limit(1))[0]; if (!booking) return c.json({ message: 'Request not found' }, 404); if (auth.user.role !== 'ADMIN' && booking.userId !== auth.user.id) return c.json({ message: 'Forbidden' }, 403); await db.delete(schema.bookings).where(eq(schema.bookings.id, id)); await audit(db, auth.user.id, 'DELETE_BOOKING', id, { roomId: booking.roomId }); return c.json({ success: true }) })

export { requestRoutes }
