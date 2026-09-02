import { Hono } from 'hono'
import { publicRoutes } from '../src/server/routes/public.js'
import { authRoutes } from '../src/server/routes/auth.js'
import { requestRoutes } from '../src/server/routes/requests.js'
import { managementRoutes } from '../src/server/routes/management.js'

type Bindings = { DB?: D1Database; JWT_SECRET?: string }
const app = new Hono<{ Bindings: Bindings }>()

app.get('/api/health', (c) => c.json({ status: 'ok' }))
app.route('/api/auth', authRoutes)
app.route('/api', requestRoutes)
app.route('/api', managementRoutes)
app.route('/api', publicRoutes)
app.notFound((c) => c.json({ error: 'Not found' }, 404))

export default app
