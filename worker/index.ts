import { Hono } from 'hono'
import { publicRoutes } from '../src/server/routes/public.js'

type Bindings = { DB?: D1Database }
const app = new Hono<{ Bindings: Bindings }>()

app.get('/api/health', (c) => c.json({ status: 'ok' }))
app.route('/api', publicRoutes)
app.notFound((c) => c.json({ error: 'Not found' }, 404))

export default app
