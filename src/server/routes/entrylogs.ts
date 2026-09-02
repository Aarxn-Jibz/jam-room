import { desc } from 'drizzle-orm'
import { Hono } from 'hono'
import { getDb, schema } from '../db/client.js'
import { authenticated } from './auth.js'

type Bindings = { DB: D1Database; JWT_SECRET?: string }
const entryLogRoutes = new Hono<{ Bindings: Bindings }>()
async function admin(c: { env: Bindings; req: { header(name: string): string | undefined } }) { const auth = await authenticated(c); return auth?.user.role === 'ADMIN' && !auth.user.mustChangePassword ? auth : null }
entryLogRoutes.get('/entrylogs', async c => { const auth = await admin(c); if (!auth) return c.json({ error: 'Forbidden' }, 403); const logs = await getDb(c.env.DB).select().from(schema.auditLogs).orderBy(desc(schema.auditLogs.createdAt)).limit(200); return c.json(logs.map(log => ({ id: log.id, scanned_at: new Date(log.createdAt).toISOString(), student_name: log.targetType === 'STUDENT' ? log.targetId : null, equipment_id: log.targetType === 'EQUIPMENT' ? log.targetId : null }))) })
entryLogRoutes.post('/entrylogs', async c => { const auth = await admin(c); if (!auth) return c.json({ error: 'Forbidden' }, 403); await getDb(c.env.DB).insert(schema.auditLogs).values({ id: crypto.randomUUID(), actorId: auth.user.id, action: 'ENTRY_SCAN', targetType: 'ENTRY', targetId: null, metadata: '{}', createdAt: Date.now() }); return c.json({ message: 'Scan completed successfully' }) })
export { entryLogRoutes }
