import { Hono } from 'hono'

type Bindings = { DB?: D1Database }
const app = new Hono<{ Bindings: Bindings }>()

app.get('/api/health', (c) => c.json({ status: 'ok' }))
app.notFound((c) => c.json({ error: 'Not found' }, 404))

export default app
