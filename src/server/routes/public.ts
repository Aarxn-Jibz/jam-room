import { Hono } from 'hono'
import { asc, eq } from 'drizzle-orm'
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
