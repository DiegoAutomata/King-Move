import type { BotDifficulty } from './botEngine'

const SKILL_LEVELS: Record<BotDifficulty, number> = {
  easy:   1,
  medium: 5,
  hard:   12,
  expert: 18,
}

const MOVE_TIMES: Record<BotDifficulty, number> = {
  easy:   50,
  medium: 200,
  hard:   500,
  expert: 1000,
}

export interface StockfishMove {
  from: string
  to: string
  promotion?: string
}

class StockfishEngine {
  private worker: Worker | null = null
  private pending: ((move: StockfishMove | null) => void) | null = null
  private ready = false
  private initPromise: Promise<void> | null = null

  async init(): Promise<void> {
    if (this.initPromise) return this.initPromise

    this.initPromise = new Promise<void>((resolve, reject) => {
      try {
        this.worker = new Worker('/stockfish.js')

        this.worker.onmessage = (event: MessageEvent) => {
          const line = String(event.data)

          if (line === 'uciok') {
            this.worker!.postMessage('setoption name Hash value 16')
            this.worker!.postMessage('isready')
          } else if (line === 'readyok') {
            this.ready = true
            resolve()
          } else if (line.startsWith('bestmove') && this.pending) {
            const raw = line.split(' ')[1]
            const move = this.parseMove(raw)
            this.pending(move)
            this.pending = null
          }
        }

        this.worker.onerror = (e) => {
          console.error('[Stockfish] Worker error:', e)
          reject(e)
        }

        this.worker.postMessage('uci')
      } catch (e) {
        reject(e)
      }
    })

    return this.initPromise
  }

  private parseMove(raw: string): StockfishMove | null {
    if (!raw || raw === '(none)' || raw.length < 4) return null
    return {
      from:       raw.slice(0, 2),
      to:         raw.slice(2, 4),
      promotion:  raw.length === 5 ? raw[4] : undefined,
    }
  }

  async getBestMove(fen: string, difficulty: BotDifficulty): Promise<StockfishMove | null> {
    await this.init()
    if (!this.ready || !this.worker) return null

    return new Promise<StockfishMove | null>((resolve) => {
      this.pending = resolve
      this.worker!.postMessage('ucinewgame')
      this.worker!.postMessage(`setoption name Skill Level value ${SKILL_LEVELS[difficulty]}`)
      this.worker!.postMessage(`position fen ${fen}`)
      this.worker!.postMessage(`go movetime ${MOVE_TIMES[difficulty]}`)
    })
  }

  destroy() {
    if (this.worker) {
      this.worker.postMessage('quit')
      this.worker.terminate()
    }
    this.worker = null
    this.ready = false
    this.initPromise = null
    this.pending = null
  }
}

// Singleton — one engine instance per session
export const stockfishEngine = new StockfishEngine()
