import { Hono } from 'hono'
import { and, asc, eq, gt, inArray, lt } from 'drizzle-orm'
import { getDb, schema } from '../db/client.js'

type Bindings = { DB: D1Database }
export const publicRoutes = new Hono<{ Bindings: Bindings }>()

publicRoutes.get('/rooms', async (c) => {
  const rooms = await getDb(c.env.DB).select({ id: schema.rooms.id, number: schema.rooms.number, name: schema.rooms.name })
    .from(schema.rooms).where(eq(schema.rooms.active, true)).orderBy(asc(schema.rooms.number), asc(schema.rooms.name))
  return c.json(rooms)
})

publicRoutes.get('/bands', async (c) => {
  const bands = await getDb(c.env.DB).select({ id: schema.profiles.id, name: schema.profiles.name, colour: schema.profiles.color })
    .from(schema.profiles).where(eq(schema.profiles.active, true)).orderBy(asc(schema.profiles.name))
  return c.json(bands)
})

publicRoutes.get('/slotconfig', async (c) => {
  const slots = await getDb(c.env.DB).select().from(schema.operatingSchedules)
  const unique = new Map<string, { id: string; start_time: string; end_time: string; enabled: boolean }>()
  for (const slot of slots) unique.set(`${slot.startTime}|${slot.endTime}`, { id: slot.id, start_time: slot.startTime, end_time: slot.endTime, enabled: slot.enabled })
  return c.json([...unique.values()].sort((a, b) => a.start_time.localeCompare(b.start_time)))
})

publicRoutes.get('/slots', async (c) => {
  const start = Date.parse(c.req.query('start') ?? '')
  const end = Date.parse(c.req.query('end') ?? '')
  const roomNumber = Number(c.req.query('roomNumber'))
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || !Number.isInteger(roomNumber)) return c.json({ message: 'Invalid slot query' }, 400)
  const db = getDb(c.env.DB)
  const room = (await db.select().from(schema.rooms).where(and(eq(schema.rooms.number, roomNumber), eq(schema.rooms.active, true))).limit(1))[0]
  if (!room) return c.json([])
  const bookings = await db.select({ id: schema.bookings.id, band_id: schema.bookings.profileId, band_name: schema.profiles.name, slot_start: schema.bookings.startTime, slot_end: schema.bookings.endTime })
    .from(schema.bookings).innerJoin(schema.profiles, eq(schema.bookings.profileId, schema.profiles.id))
    .where(and(eq(schema.bookings.roomId, room.id), inArray(schema.bookings.status, ['PENDING', 'APPROVED']), lt(schema.bookings.startTime, end), gt(schema.bookings.endTime, start)))
  return c.json(bookings.map((booking) => ({ ...booking, status: 'booked', room_id: room.id, slot_start: new Date(booking.slot_start).toISOString(), slot_end: new Date(booking.slot_end).toISOString() })))
})
