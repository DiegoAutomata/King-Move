"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Chessboard } from "react-chessboard";
import { Crown, ArrowLeft, Bot, RotateCcw, Trophy, Minus, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useBotGame } from "@/features/chess-engine/hooks/useBotGame";
import { difficultyFromElo, BOT_ELO_LABELS, DIFFICULTY_LABELS, DIFFICULTY_COLORS, type BotDifficulty } from "@/features/chess-engine/lib/botEngine";

function BotGameInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const movesEndRef = useRef<HTMLDivElement>(null);
  const [boardWidth, setBoardWidth] = useState(400);
  const startedRef = useRef(false);

  const {
    fen,
    status,
    playerColor,
    lastMove,
    moves,
    isThinking,
    difficulty,
    resultReason,
    startGame,
    makePlayerMove,
    resetGame,
  } = useBotGame();

  // Responsive board
  useEffect(() => {
    function measure() {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      setBoardWidth(Math.max(200, Math.min(width, height)));
    }
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Auto-scroll historial
  useEffect(() => {
    movesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [moves.length]);

  // Iniciar partida al montar (con params de la URL)
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const depthParam = searchParams.get("depth");
    const colorParam = searchParams.get("color") as "white" | "black" | "random" | null;
    const playerElo = profile?.elo ?? 1200;

    const autoLevel = difficultyFromElo(playerElo);
    let diff: BotDifficulty = autoLevel;
    if (depthParam === "1") diff = "easy";
    else if (depthParam === "2") diff = "medium";
    else if (depthParam === "3") diff = "hard";
    else if (depthParam === "4") diff = "expert";

    const color = colorParam ?? "random";
    startGame(color, diff);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  function onPieceDrop(from: string, to: string) {
    return makePlayerMove(from, to);
  }

  // Armar pares de movimientos para mostrar en notación de ajedrez
  const movePairs: Array<{ w?: string; b?: string }> = [];
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({ w: moves[i]?.san, b: moves[i + 1]?.san });
  }

  const isFlipped = playerColor === "black";
  const isGameOver = status !== "idle" && status !== "playing";

  const botName = `King Bot — ${DIFFICULTY_LABELS[difficulty]}`;
  const botElo = BOT_ELO_LABELS[difficulty];

  return (
    <div className="flex h-full w-full gap-4 p-4">
      {/* ── Tablero ── */}
      <div className="flex flex-col flex-1 min-w-0 gap-2">

        {/* Barra superior: Bot */}
        <div className="flex justify-between items-center bg-bg-panel border border-white/5 px-3 py-2 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-chess/15 border border-primary-chess/20 flex items-center justify-center">
              <Bot size={16} className="text-primary-chess" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-200 leading-none">{botName}</p>
              <p className="text-[10px] text-gray-500">{botElo} ELO</p>
            </div>
          </div>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${DIFFICULTY_COLORS[difficulty]}`}>
            {DIFFICULTY_LABELS[difficulty]}
          </span>
        </div>

        {/* Tablero */}
        <div ref={containerRef} className="flex-1 flex items-center justify-center relative">
          {/* @ts-ignore */}
          {(Chessboard as any)({
            id: "BotBoard",
            position: fen,
            onPieceDrop,
            boardWidth,
            boardOrientation: isFlipped ? "black" : "white",
            customDarkSquareStyle: { backgroundColor: "#b58863" },
            customLightSquareStyle: { backgroundColor: "#f0d9b5" },
            customSquareStyles: lastMove ? {
              [lastMove.from]: { backgroundColor: "rgba(255,255,0,0.3)" },
              [lastMove.to]:   { backgroundColor: "rgba(255,255,0,0.4)" },
            } : {},
            arePiecesDraggable: status === "playing" && !isThinking,
          })}

          {/* Indicador de thinking */}
          {isThinking && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-bg-panel/90 border border-primary-chess/20 px-3 py-1.5 rounded-full flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-chess animate-pulse" />
              <span className="text-xs text-gray-400">Bot thinking…</span>
            </div>
          )}

          {/* Overlay resultado */}
          {isGameOver && (
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
              <div className="bg-bg-panel border border-white/10 p-8 rounded-2xl flex flex-col items-center gap-5 shadow-xl">
                {status === "won" && <Trophy size={40} className="text-primary-chess" />}
                {status === "lost" && <X size={40} className="text-red-400" />}
                {status === "draw" && <Minus size={40} className="text-gray-400" />}

                <div className="text-center">
                  <p className="text-2xl font-black text-white">
                    {status === "won" ? "You Win!" : status === "lost" ? "You Lost" : "Draw"}
                  </p>
                  {resultReason && (
                    <p className="text-sm text-gray-400 mt-1">{resultReason}</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => { resetGame(); startedRef.current = false; }}
                    className="flex items-center gap-2 bg-primary-chess hover:bg-primary-hover text-black px-5 py-2.5 rounded-xl font-black transition-all hover:scale-105"
                  >
                    <RotateCcw size={16} />
                    Play Again
                  </button>
                  <button
                    onClick={() => router.push("/play")}
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-gray-300 px-5 py-2.5 rounded-xl font-bold transition-all"
                  >
                    <ArrowLeft size={16} />
                    Back
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Barra inferior: jugador */}
        <div className="flex justify-between items-center bg-bg-panel border border-white/5 px-3 py-2 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Crown size={14} className="text-primary-chess" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-200 leading-none">
                {profile?.full_name ?? "You"}
              </p>
              <p className="text-[10px] text-gray-500">{profile?.elo ?? 1200} ELO</p>
            </div>
          </div>
          <span className="text-xs text-gray-500">
            {isThinking ? "Waiting…" : status === "playing" ? "Your turn" : ""}
          </span>
        </div>
      </div>

      {/* ── Panel lateral ── */}
      <div className="w-64 flex flex-col gap-3 shrink-0">

        {/* Botón volver */}
        <button
          onClick={() => router.push("/play")}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft size={14} />
          Back to Play
        </button>

        {/* Info de la partida */}
        <div className="bg-bg-panel border border-white/5 rounded-xl p-4 flex flex-col gap-3">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Bot Match</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Difficulty</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${DIFFICULTY_COLORS[difficulty]}`}>
              {DIFFICULTY_LABELS[difficulty]}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Playing as</span>
            <span className="text-xs font-bold text-white capitalize">{playerColor}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Moves</span>
            <span className="text-xs font-bold text-white">{moves.length}</span>
          </div>
        </div>

        {/* Historial de movimientos */}
        <div className="bg-bg-panel border border-white/5 rounded-xl flex-1 overflow-hidden flex flex-col">
          <div className="px-4 pt-4 pb-2 border-b border-white/5">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Moves</p>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-0.5">
            {movePairs.length === 0 && (
              <p className="text-xs text-gray-600 text-center mt-4">No moves yet</p>
            )}
            {movePairs.map((pair, i) => (
              <div key={i} className="flex gap-1 text-xs font-mono">
                <span className="text-gray-600 w-5 shrink-0">{i + 1}.</span>
                <span className="text-gray-300 w-12">{pair.w ?? ""}</span>
                <span className="text-gray-300 w-12">{pair.b ?? ""}</span>
              </div>
            ))}
            <div ref={movesEndRef} />
          </div>
        </div>

        {/* Play Again / Resign */}
        {status === "playing" && (
          <button
            onClick={() => { resetGame(); startedRef.current = false; }}
            className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
          >
            <RotateCcw size={14} />
            New Game
          </button>
        )}
      </div>
    </div>
  );
}

export default function BotGamePage() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center text-gray-500">Loading…</div>}>
      <BotGameInner />
    </Suspense>
  );
}
