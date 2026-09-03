import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { SignJWT, jwtVerify } from 'jose'
import { compare, genSalt, hash } from 'bcryptjs'
import { changePasswordSchema, loginSchema, registerSchema } from '../schemas.js'
import { getDb, schema } from '../db/client.js'

type Bindings = { DB: D1Database; JWT_SECRET?: string }
type Claims = { sessionId: string; userId: string; role: 'USER' | 'ADMIN' }
const authRoutes = new Hono<{ Bindings: Bindings }>()

const secret = (value: string | undefined) => {
  if (!value || value.length < 32) throw new Error('JWT_SECRET must be configured with at least 32 characters')
  return new TextEncoder().encode(value)
}
const cookie = (name: string, value: string, maxAge: number, secure: boolean) => `${name}=${encodeURIComponent(value)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure ? '; Secure' : ''}`
const readCookie = (header: string | undefined) => header?.match(/(?:^|;)\s*token=([^;]+)/)?.[1]
const asUser = (user: { id: string; name: string; email: string; role: 'USER' | 'ADMIN'; mustChangePassword: boolean }, profiles: { id: string; name: string }[]) => ({ id: user.id, name: user.name, email: user.email, role: user.role === 'ADMIN' ? 'admin' : 'user', bands: profiles, mustChangePassword: user.mustChangePassword })

async function authenticated(c: { req: { header(name: string): string | undefined }; env: Bindings }) {
  const raw = readCookie(c.req.header('cookie'))
  if (!raw) return null
  try {
    const { payload } = await jwtVerify(decodeURIComponent(raw), secret(c.env.JWT_SECRET))
    const claims = payload as unknown as Claims
    const db = getDb(c.env.DB)
    const session = (await db.select().from(schema.sessions).where(and(eq(schema.sessions.id, claims.sessionId), eq(schema.sessions.userId, claims.userId))).limit(1))[0]
    if (!session || session.revoked || session.expiresAt <= Date.now()) return null
    const user = (await db.select().from(schema.users).where(eq(schema.users.id, claims.userId)).limit(1))[0]
    return user?.active ? { user, session } : null
  } catch { return null }
}

async function profilesFor(db: ReturnType<typeof getDb>, userId: string) {
  return db.select({ id: schema.profiles.id, name: schema.profiles.name }).from(schema.userProfiles).innerJoin(schema.profiles, eq(schema.userProfiles.profileId, schema.profiles.id)).where(eq(schema.userProfiles.userId, userId))
}

authRoutes.post('/login', async c => {
  const parsed = loginSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) return c.json({ error: 'Validation failed' }, 400)
  const db = getDb(c.env.DB); const identifier = parsed.data.email ?? parsed.data.username ?? ''
  const user = (await db.select().from(schema.users).where(eq(schema.users.email, identifier)).limit(1))[0] ?? (await db.select().from(schema.users).where(eq(schema.users.username, identifier)).limit(1))[0]
  if (!user || !user.active || !(await compare(parsed.data.password, user.passwordHash))) return c.json({ error: 'Invalid username or password' }, 401)
  const now = Date.now(); const expiresAt = now + 86_400_000; const sessionId = crypto.randomUUID()
  await db.insert(schema.sessions).values({ id: sessionId, userId: user.id, createdAt: now, lastSeenAt: now, expiresAt, revoked: false })
  const token = await new SignJWT({ sessionId, userId: user.id, role: user.role }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime(Math.floor(expiresAt / 1000)).sign(secret(c.env.JWT_SECRET))
  c.header('Set-Cookie', cookie('token', token, 86_400, c.req.url.startsWith('https://')))
  return c.json({ success: true, user: asUser(user, await profilesFor(db, user.id)) })
})

authRoutes.get('/me', async c => { const auth = await authenticated(c); if (!auth) return c.json({ error: 'Unauthorized' }, 401); return c.json(asUser(auth.user, await profilesFor(getDb(c.env.DB), auth.user.id))) })
authRoutes.post('/logout', async c => { const auth = await authenticated(c); if (auth) await getDb(c.env.DB).update(schema.sessions).set({ revoked: true }).where(eq(schema.sessions.id, auth.session.id)); c.header('Set-Cookie', cookie('token', '', 0, c.req.url.startsWith('https://'))); return c.json({ success: true }) })

authRoutes.patch('/me/password', async c => {
  const auth = await authenticated(c); if (!auth) return c.json({ error: 'Unauthorized' }, 401)
  const parsed = changePasswordSchema.safeParse(await c.req.json().catch(() => ({}))); if (!parsed.success) return c.json({ error: 'Validation failed' }, 400)
  if (!(await compare(parsed.data.currentPassword, auth.user.passwordHash))) return c.json({ error: 'Incorrect current password' }, 401)
  await getDb(c.env.DB).update(schema.users).set({ passwordHash: await hash(parsed.data.newPassword, await genSalt(10)), mustChangePassword: false, updatedAt: Date.now() }).where(eq(schema.users.id, auth.user.id))
  return c.json({ success: true })
})

authRoutes.post('/register', async c => {
  const auth = await authenticated(c); if (!auth || auth.user.role !== 'ADMIN') return c.json({ error: 'Forbidden' }, 403)
  const parsed = registerSchema.safeParse(await c.req.json().catch(() => ({}))); if (!parsed.success) return c.json({ error: 'Validation failed' }, 400)
  const db = getDb(c.env.DB); const email = parsed.data.email.toLowerCase(); if ((await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1))[0]) return c.json({ error: 'User already exists' }, 409)
  const now = Date.now(); const id = crypto.randomUUID(); const user = { id, username: email, email, name: parsed.data.name, passwordHash: await hash(parsed.data.password ?? 'changeit', await genSalt(10)), role: parsed.data.role === 'admin' ? 'ADMIN' as const : 'USER' as const, mustChangePassword: true, active: true, createdAt: now, updatedAt: now }
  await db.insert(schema.users).values(user); if (parsed.data.bandIds?.length) await db.insert(schema.userProfiles).values(parsed.data.bandIds.map(profileId => ({ userId: id, profileId }))).onConflictDoNothing()
  return c.json({ message: 'User registered successfully', user: asUser(user, await profilesFor(db, id)) }, 201)
})

export { authRoutes, authenticated }
