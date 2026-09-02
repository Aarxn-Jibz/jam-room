import { Hono } from 'hono'
import { publicRoutes } from '../src/server/routes/public.js'
import { authRoutes } from '../src/server/routes/auth.js'
import { requestRoutes } from '../src/server/routes/requests.js'
import { managementRoutes } from '../src/server/routes/management.js'
import { entryLogRoutes } from '../src/server/routes/entrylogs.js'
import { sheetsRoutes } from '../src/server/routes/sheets.js'
import { runWeeklyExport } from '../src/server/routes/sheets.js'
import { getDb } from '../src/server/db/client.js'

type Bindings = { DB?: D1Database; JWT_SECRET?: string; GOOGLE_SERVICE_ACCOUNT?: string; SMTP_HOST?: string; SMTP_PORT?: string; SMTP_USER?: string; SMTP_PASSWORD?: string }
const app = new Hono<{ Bindings: Bindings }>()
const windows = new Map<string, { count: number; resetAt: number }>()
app.use('/api/*', async (c, next) => {
  const key = c.req.header('CF-Connecting-IP') ?? 'unknown'; const now = Date.now(); const entry = windows.get(key)
  if (!entry || entry.resetAt <= now) windows.set(key, { count: 1, resetAt: now + 60_000 })
  else if (entry.count >= 120) return c.json({ error: 'Too many requests' }, 429)
  else entry.count += 1
  await next()
})

app.get('/api/health', (c) => c.json({ status: 'ok' }))
app.route('/api/auth', authRoutes)
app.route('/api', requestRoutes)
app.route('/api', managementRoutes)
app.route('/api', entryLogRoutes)
app.route('/api', sheetsRoutes)
app.route('/api', publicRoutes)
app.notFound((c) => c.json({ error: 'Not found' }, 404))

export default {
  fetch: app.fetch,
  scheduled(_event: ScheduledController, env: Bindings, ctx: ExecutionContext) {
    if (env.DB) ctx.waitUntil(runWeeklyExport(getDb(env.DB), env))
  },
}
