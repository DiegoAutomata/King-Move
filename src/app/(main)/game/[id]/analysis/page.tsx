"use client";

import { use, useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { ArrowLeft, ArrowRight, ChevronFirst, ChevronLast, Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface StoredMove {
  from: string;
  to: string;
  promotion?: string;
  san: string;
  fen: string;
}

interface MoveEval {
  cp?: number;
  mate?: number;
  loading: boolean;
}

function EvalBar({ cp, mate }: { cp?: number; mate?: number }) {
  let score = 0;
  let label = "0.0";

  if (mate !== undefined) {
    score = mate > 0 ? 100 : -100;
    label = `M${Math.abs(mate)}`;
  } else if (cp !== undefined) {
    score = Math.max(-10, Math.min(10, cp / 100));
    label = cp >= 0 ? `+${(cp / 100).toFixed(1)}` : (cp / 100).toFixed(1);
  }

  // Convert score [-10, 10] to percentage [0, 100] for white
  const whitePct = Math.round(((score + 10) / 20) * 100);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-4 h-48 bg-gray-800 rounded-full overflow-hidden flex flex-col-reverse border border-white/10">
        <div
          className="bg-white rounded-full transition-all duration-500"
          style={{ height: `${whitePct}%` }}
        />
      </div>
      <span className={`text-xs font-black font-mono ${cp !== undefined && cp >= 0 ? "text-white" : "text-gray-400"}`}>
        {label}
      </span>
    </div>
  );
}

async function fetchEval(fen: string): Promise<{ cp?: number; mate?: number } | null> {
  try {
    const res = await fetch(
      `/api/lichess-eval?fen=${encodeURIComponent(fen)}`,
      { cache: "force-cache" }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default function AnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: gameId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [boardWidth, setBoardWidth] = useState(400);

  const [moves, setMoves] = useState<StoredMove[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0); // 0 = start position
  const [evals, setEvals] = useState<Record<number, MoveEval>>({});
  const [loading, setLoading] = useState(true);
  const [playerWhite, setPlayerWhite] = useState<string>("");
  const [playerBlack, setPlayerBlack] = useState<string>("");
  const [myColor, setMyColor] = useState<"white" | "black" | null>(null);

  // Compute FEN for current index
  const currentFen = useCallback(() => {
    if (currentIndex === 0) return new Chess().fen();
    return moves[currentIndex - 1]?.fen ?? new Chess().fen();
  }, [currentIndex, moves]);

  const lastMoveHighlight: Record<string, React.CSSProperties> = {};
  if (currentIndex > 0 && moves[currentIndex - 1]) {
    const m = moves[currentIndex - 1];
    lastMoveHighlight[m.from] = { backgroundColor: "rgba(255, 214, 10, 0.35)" };
    lastMoveHighlight[m.to] = { backgroundColor: "rgba(255, 214, 10, 0.5)" };
  }

  // Load game
  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: game } = await supabase
        .from("games")
        .select("*, white:player_white(full_name, email), black:player_black(full_name, email)")
        .eq("id", gameId)
        .single();

      if (!game) { setLoading(false); return; }

      const storedMoves = (game.moves ?? []) as StoredMove[];
      setMoves(storedMoves);
      setCurrentIndex(storedMoves.length); // start at end position

      const w = (game as unknown as { white?: { full_name?: string; email?: string } }).white;
      const b = (game as unknown as { black?: { full_name?: string; email?: string } }).black;
      setPlayerWhite(w?.full_name ?? w?.email?.split("@")[0] ?? "White");
      setPlayerBlack(b?.full_name ?? b?.email?.split("@")[0] ?? "Black");

      if (user) {
        setMyColor(game.player_white === user.id ? "white" : game.player_black === user.id ? "black" : null);
      }
      setLoading(false);
    }
    load();
  }, [gameId, user]);

  // Fetch eval for current position
  useEffect(() => {
    const fen = currentFen();
    if (evals[currentIndex] !== undefined) return;

    setEvals(prev => ({ ...prev, [currentIndex]: { loading: true } }));
    fetchEval(fen).then(result => {
      setEvals(prev => ({
        ...prev,
        [currentIndex]: result
          ? { cp: result.cp, mate: result.mate, loading: false }
          : { loading: false },
      }));
    });
  }, [currentIndex, currentFen, evals]);

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") setCurrentIndex(i => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setCurrentIndex(i => Math.min(moves.length, i + 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moves.length]);

  // Responsive board
  useEffect(() => {
    function measure() {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      setBoardWidth(Math.max(200, Math.min(width, height) - 8));
    }
    measure();
    const obs = new ResizeObserver(measure);
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const currentEval = evals[currentIndex];
  const movePairs = moves.reduce<{ white: string; black?: string; num: number; wIdx: number; bIdx?: number }[]>((acc, m, i) => {
    if (i % 2 === 0) acc.push({ num: Math.floor(i / 2) + 1, white: m.san, wIdx: i + 1 });
    else { acc[acc.length - 1].black = m.san; acc[acc.length - 1].bIdx = i + 1; }
    return acc;
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary-chess" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Board area */}
      <div className="flex-1 min-w-0 bg-bg-chess flex items-center justify-center p-3 overflow-hidden border-r border-white/5">
        <div ref={containerRef} className="w-full h-full flex flex-col items-center justify-center gap-2 max-w-[700px]">
          {/* Black player */}
          <div style={{ width: boardWidth }} className="flex justify-between items-center bg-bg-panel border border-white/5 px-3 py-2 rounded-lg shrink-0">
            <span className="font-bold text-gray-300 text-sm">{playerBlack}</span>
            <span className="text-xs text-gray-500">Black</span>
          </div>

          {/* Board + eval bar */}
          <div className="flex items-center gap-3">
            {currentEval?.loading ? (
              <div className="flex flex-col items-center gap-1">
                <div className="w-4 h-48 bg-gray-800 rounded-full border border-white/10 flex items-center justify-center">
                  <Loader2 size={10} className="animate-spin text-gray-500" />
                </div>
              </div>
            ) : (
              <EvalBar cp={currentEval?.cp} mate={currentEval?.mate} />
            )}

            {(Chessboard as unknown as (props: object) => React.ReactElement)({
              id: "Analysis",
              position: currentFen(),
              boardWidth,
              boardOrientation: myColor ?? "white",
              arePiecesDraggable: false,
              customDarkSquareStyle: { backgroundColor: "#b58863" },
              customLightSquareStyle: { backgroundColor: "#f0d9b5" },
              customSquareStyles: lastMoveHighlight,
            })}
          </div>

          {/* White player */}
          <div style={{ width: boardWidth }} className="flex justify-between items-center bg-bg-panel border border-white/5 px-3 py-2 rounded-lg shrink-0">
            <span className="font-bold text-gray-300 text-sm">{playerWhite}</span>
            <span className="text-xs text-gray-500">White</span>
          </div>

          {/* Nav controls */}
          <div style={{ width: boardWidth }} className="flex items-center justify-center gap-2 mt-1 shrink-0">
            <button onClick={() => setCurrentIndex(0)} className="w-9 h-9 bg-bg-panel border border-white/10 hover:border-primary-chess/30 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <ChevronFirst size={18} />
            </button>
            <button onClick={() => setCurrentIndex(i => Math.max(0, i - 1))} className="w-9 h-9 bg-bg-panel border border-white/10 hover:border-primary-chess/30 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <ArrowLeft size={18} />
            </button>
            <span className="text-xs text-gray-500 w-20 text-center font-mono">
              {currentIndex === 0 ? "Start" : currentIndex === moves.length ? "End" : `Move ${currentIndex}`}
            </span>
            <button onClick={() => setCurrentIndex(i => Math.min(moves.length, i + 1))} className="w-9 h-9 bg-bg-panel border border-white/10 hover:border-primary-chess/30 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <ArrowRight size={18} />
            </button>
            <button onClick={() => setCurrentIndex(moves.length)} className="w-9 h-9 bg-bg-panel border border-white/10 hover:border-primary-chess/30 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <ChevronLast size={18} />
            </button>
          </div>
          <p className="text-xs text-gray-600">← → arrow keys to navigate</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-64 bg-bg-sidebar border-l border-white/5 flex flex-col p-4 gap-4 shrink-0">
        <button
          onClick={() => router.push(`/game/${gameId}`)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm font-semibold transition-colors"
        >
          <ArrowLeft size={16} /> Back to game
        </button>

        {/* Eval summary */}
        {currentEval && !currentEval.loading && (
          <div className="bg-bg-panel border border-white/5 rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-2">Evaluation</p>
            <div className="flex items-center gap-2">
              {currentEval.cp !== undefined && currentEval.cp > 50 && <TrendingUp size={16} className="text-green-400" />}
              {currentEval.cp !== undefined && currentEval.cp < -50 && <TrendingDown size={16} className="text-red-400" />}
              {currentEval.cp !== undefined && Math.abs(currentEval.cp) <= 50 && <Minus size={16} className="text-gray-400" />}
              <span className="text-2xl font-black text-white">
                {currentEval.mate !== undefined
                  ? `M${Math.abs(currentEval.mate)}`
                  : currentEval.cp !== undefined
                    ? (currentEval.cp >= 0 ? `+${(currentEval.cp / 100).toFixed(1)}` : (currentEval.cp / 100).toFixed(1))
                    : "—"}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {currentEval.cp !== undefined && currentEval.cp > 100 ? "White is better"
                : currentEval.cp !== undefined && currentEval.cp < -100 ? "Black is better"
                : currentEval.mate !== undefined ? `Forced mate in ${Math.abs(currentEval.mate)}`
                : "Equal position"}
            </p>
          </div>
        )}

        {/* Move list */}
        <div className="bg-bg-panel border border-white/5 rounded-xl p-3 flex flex-col gap-2 flex-1 min-h-0">
          <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider shrink-0">Moves ({moves.length})</p>
          <div className="overflow-y-auto flex-1 min-h-0 scrollbar-none">
            {movePairs.map(pair => (
              <div key={pair.num} className="flex gap-1 text-xs font-mono mb-0.5">
                <span className="text-gray-600 w-6 shrink-0">{pair.num}.</span>
                <button
                  onClick={() => setCurrentIndex(pair.wIdx)}
                  className={`w-12 text-left px-1 rounded transition-colors ${currentIndex === pair.wIdx ? "bg-primary-chess/20 text-primary-chess font-bold" : "text-gray-300 hover:text-white"}`}
                >
                  {pair.white}
                </button>
                {pair.black && pair.bIdx !== undefined && (
                  <button
                    onClick={() => setCurrentIndex(pair.bIdx!)}
                    className={`w-12 text-left px-1 rounded transition-colors ${currentIndex === pair.bIdx ? "bg-primary-chess/20 text-primary-chess font-bold" : "text-gray-400 hover:text-white"}`}
                  >
                    {pair.black}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
