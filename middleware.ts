import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from './src/shared/lib/supabase/middleware'

// In-memory rate limiter (per cold-start instance — fine for beta)
// For production scale: replace with @upstash/ratelimit + Redis
const limits = new Map<string, { count: number; resetAt: number }>()

function checkLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = limits.get(key)
  if (!entry || now > entry.resetAt) {
    limits.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= max) return false
  entry.count++
  return true
}

function tooMany() {
  return NextResponse.json(
    { error: 'Too many requests. Please slow down.' },
    { status: 429, headers: { 'Retry-After': '60' } }
  )
}

export async function middleware(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'

  const path = req.nextUrl.pathname

  // /api/chat — 10 req/min per IP (AI tutor is expensive)
  if (path === '/api/chat') {
    if (!checkLimit(`chat:${ip}`, 10, 60_000)) return tooMany()
  }

  // /api/puzzle/next — 60 req/min per IP (Lichess proxy, Puzzle Rush uses ~12/min)
  if (path === '/api/puzzle/next') {
    if (!checkLimit(`puzzle:${ip}`, 60, 60_000)) return tooMany()
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
