import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from './src/shared/lib/supabase/middleware'

// ---------------------------------------------------------------------------
// Rate limiting — Upstash Redis when env vars are present, in-memory fallback
// ---------------------------------------------------------------------------
type InMemoryEntry = { count: number; resetAt: number }
const inMemoryLimits = new Map<string, InMemoryEntry>()

function inMemoryCheck(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = inMemoryLimits.get(key)
  if (!entry || now > entry.resetAt) {
    inMemoryLimits.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= max) return false
  entry.count++
  return true
}

// Lazily-built Upstash limiters — undefined when env vars are absent
let _chatLimiter:   import('@upstash/ratelimit').Ratelimit | undefined
let _puzzleLimiter: import('@upstash/ratelimit').Ratelimit | undefined
let _upstashReady = false
let _upstashInit  = false

async function initUpstash() {
  if (_upstashInit) return
  _upstashInit = true
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return
  try {
    const { Ratelimit } = await import('@upstash/ratelimit')
    const { Redis }     = await import('@upstash/redis')
    const redis = Redis.fromEnv()
    _chatLimiter   = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10,  '1 m'), prefix: 'rl:chat' })
    _puzzleLimiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, '1 m'), prefix: 'rl:puzzle' })
    _upstashReady  = true
  } catch {
    // Upstash unavailable — fall through to in-memory
  }
}

async function checkLimit(key: string, max: number, limiter?: import('@upstash/ratelimit').Ratelimit): Promise<boolean> {
  if (_upstashReady && limiter) {
    try {
      const { success } = await limiter.limit(key)
      return success
    } catch {
      // Redis error — fall back to in-memory for this request
    }
  }
  return inMemoryCheck(key, max, 60_000)
}

function tooMany() {
  return NextResponse.json(
    { error: 'Too many requests. Please slow down.' },
    { status: 429, headers: { 'Retry-After': '60' } }
  )
}

export async function middleware(req: NextRequest) {
  await initUpstash()

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'

  const path = req.nextUrl.pathname

  // /api/chat — 10 req/min per IP (AI tutor is expensive)
  if (path === '/api/chat') {
    if (!await checkLimit(`chat:${ip}`, 10, _chatLimiter)) return tooMany()
  }

  // /api/puzzle/next — 60 req/min per IP (Lichess proxy, Puzzle Rush uses ~12/min)
  if (path === '/api/puzzle/next') {
    if (!await checkLimit(`puzzle:${ip}`, 60, _puzzleLimiter)) return tooMany()
  }

  // Supabase session refresh for all other routes
  return await updateSession(req)
}

export const config = {
  matcher: [
    '/api/chat',
    '/api/puzzle/next',
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
