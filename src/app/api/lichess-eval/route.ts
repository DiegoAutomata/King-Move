import { type NextRequest, NextResponse } from 'next/server'

// Proxy para Lichess cloud-eval API con cache de 1 hora
export async function GET(req: NextRequest) {
  const fen = req.nextUrl.searchParams.get('fen')
  if (!fen) return NextResponse.json({ error: 'Missing fen' }, { status: 400 })

  try {
    const res = await fetch(
      `https://lichess.org/api/cloud-eval?fen=${encodeURIComponent(fen)}&multiPv=1`,
      {
        headers: { Accept: 'application/json' },
        next: { revalidate: 3600 },
      }
    )

    if (!res.ok) {
      // Lichess eval not found for this position — not an error
      return NextResponse.json({}, { status: 200 })
    }

    const data = await res.json()
    const pv = data?.pvs?.[0]

    if (!pv) return NextResponse.json({}, { status: 200 })

    return NextResponse.json(
      { cp: pv.cp, mate: pv.mate },
      {
        headers: {
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        },
      }
    )
  } catch {
    return NextResponse.json({}, { status: 200 })
  }
}
