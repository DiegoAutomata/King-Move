"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Chessboard } from "react-chessboard";
import { Chess, type Square } from "chess.js";
import { ArrowLeft, Bot, RotateCcw, Trophy, Minus, X, Clock, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useBotGame } from "@/features/chess-engine/hooks/useBotGame";
import {
  difficultyFromElo,
  BOT_ELO_LABELS,
  DIFFICULTY_LABELS,
  DIFFICULTY_COLORS,
  type BotDifficulty,
} from "@/features/chess-engine/lib/botEngine";

function formatTime(ms: number | null): string {
  if (ms === null) return "—";
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function BotGameInner() {
  const router      = useRouter();
  const params      = useSearchParams();
  const { profile } = useAuth();

  const containerRef = useRef<HTMLDivElement>(null);
  const movesEndRef  = useRef<HTMLDivElement>(null);
  const startedRef   = useRef(false);
  const [boardWidth, setBoardWidth] = useState(400);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalSquares, setLegalSquares]     = useState<string[]>([]);
  const [captureSquares, setCaptureSquares] = useState<Set<string>>(new Set());
  const [preMoveEnabled, setPreMoveEnabled] = useState(false);
  const [preMove, setPreMove]               = useState<{ from: string; to: string } | null>(null);

  const {
    fen, status, playerColor, lastMove, moves,
    isThinking, difficulty, resultReason,
    whiteTimeMs, blackTimeMs,
    startGame, beginPlay, makePlayerMove, resetGame,
  } = useBotGame();

  // Responsive board
  useEffect(() => {
    function measure() {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      setBoardWidth(Math.max(200, Math.min(width, height) - 4));
    }
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Auto-scroll move list
  useEffect(() => {
    movesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [moves.length]);

  // Clear selection on status/thinking changes (except isThinking=true when premove enabled)
  useEffect(() => {
    if (!preMoveEnabled || status !== "playing") {
      setSelectedSquare(null);
      setLegalSquares([]);
      setCaptureSquares(new Set());
    }
  }, [status]);

  // Compute legal moves whenever selected square changes
  useEffect(() => {
    if (!selectedSquare) {
      setLegalSquares([]);
      setCaptureSquares(new Set());
      return;
    }
    const chess = new Chess(fen);
    const moves = chess.moves({ square: selectedSquare as Square, verbose: true });
    setLegalSquares(moves.map(m => m.to));
    setCaptureSquares(new Set(moves.filter(m => m.captured).map(m => m.to)));
  }, [selectedSquare, fen]);

  // Execute pre-move when bot finishes thinking
  useEffect(() => {
    if (!isThinking && preMove) {
      const moved = makePlayerMove(preMove.from, preMove.to);
      setPreMove(null);
      setSelectedSquare(null);
      setLegalSquares([]);
      setCaptureSquares(new Set());
      if (!moved) {
        // Pre-move became illegal — silently discard
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isThinking]);

  // Parse URL params and kick off game
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const depth    = params.get("depth");
    const color    = params.get("color") as "white" | "black" | "random" | null;
    const timeStr  = params.get("time");
    const playerElo = profile?.elo ?? 1200;

    let diff: BotDifficulty = difficultyFromElo(playerElo);
    if (depth === "1") diff = "easy";
    else if (depth === "2") diff = "medium";
    else if (depth === "3") diff = "hard";
    else if (depth === "4") diff = "expert";

    const timeLimitMs = timeStr ? parseInt(timeStr, 10) : 10 * 60 * 1000;
    startGame(color ?? "random", diff, timeLimitMs);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const isFlipped    = playerColor === "black";
  const isGameOver   = status !== "idle" && status !== "intro" && status !== "playing";
  const botName      = `King Bot — ${DIFFICULTY_LABELS[difficulty]}`;
  const botElo       = BOT_ELO_LABELS[difficulty];
  const playerName   = profile?.full_name?.split("@")[0] ?? "Player";
  const playerEloVal = profile?.elo ?? 1200;

  const isWhiteTurn       = fen.split(" ")[1] === "w";
  const playerIsWhite     = playerColor === "white";
  const playerTimeMs      = playerIsWhite ? whiteTimeMs : blackTimeMs;
  const botTimeMs         = playerIsWhite ? blackTimeMs : whiteTimeMs;
  const playerClockActive = status === "playing" && !isThinking && (playerIsWhite === isWhiteTurn);
  const botClockActive    = status === "playing" && (playerIsWhite !== isWhiteTurn);
  const playerLow         = playerTimeMs !== null && playerTimeMs < 30_000;
  const botLow            = botTimeMs    !== null && botTimeMs    < 30_000;

  // Dot style for legal move squares (chess.com style)
  const legalDot: React.CSSProperties = {
    background: "radial-gradient(circle, rgba(0,0,0,0.20) 29%, transparent 31%)",
  };
  const captureDot: React.CSSProperties = {
    background: "radial-gradient(circle, transparent 55%, rgba(0,0,0,0.20) 57%, rgba(0,0,0,0.20) 70%, transparent 72%)",
  };

  const customSquareStyles: Record<string, React.CSSProperties> = {
    ...(lastMove ? {
      [lastMove.from]: { backgroundColor: "rgba(255,255,0,0.3)" },
      [lastMove.to]:   { backgroundColor: "rgba(255,255,0,0.45)" },
    } : {}),
    ...(preMove ? {
      [preMove.from]: { backgroundColor: "rgba(255,140,0,0.45)" },
      [preMove.to]:   { backgroundColor: "rgba(255,140,0,0.55)" },
    } : {}),
    ...(selectedSquare ? {
      [selectedSquare]: { backgroundColor: "rgba(100,180,255,0.5)" },
    } : {}),
    ...Object.fromEntries(
      legalSquares.map(sq => [sq, captureSquares.has(sq) ? captureDot : legalDot])
    ),
  };

  const isPlayerTurn = status === "playing" && !isThinking &&
    ((playerIsWhite && isWhiteTurn) || (!playerIsWhite && !isWhiteTurn));

  const handleSquareClick = ({ square }: { piece: string | null; square: string }) => {
    if (status !== "playing") return;

    // Pre-move mode: bot is thinking
    if (isThinking && preMoveEnabled) {
      if (selectedSquare) {
        if (square === selectedSquare) {
          // Deselect
          setSelectedSquare(null);
          setPreMove(null);
          return;
        }
        // Register pre-move
        setPreMove({ from: selectedSquare, to: square });
        setSelectedSquare(null);
        setLegalSquares([]);
        setCaptureSquares(new Set());
      } else {
        // Select own piece to pre-move
        const chess = new Chess(fen);
        const piece = chess.get(square as Square);
        const isOwnPiece = piece && (
          (playerColor === "white" && piece.color === "w") ||
          (playerColor === "black" && piece.color === "b")
        );
        if (isOwnPiece) setSelectedSquare(square);
      }
      return;
    }

    if (!isPlayerTurn) return;

    if (selectedSquare) {
      if (square === selectedSquare) {
        setSelectedSquare(null);
        return;
      }
      const moved = makePlayerMove(selectedSquare, square);
      setSelectedSquare(null);
      if (!moved) {
        // Might be clicking another own piece — select it
        const chess = new Chess(fen);
        const piece = chess.get(square as Square);
        const isOwnPiece = piece && (
          (playerColor === "white" && piece.color === "w") ||
          (playerColor === "black" && piece.color === "b")
        );
        if (isOwnPiece) setSelectedSquare(square);
      }
    } else {
      setSelectedSquare(square);
    }
  };

  // Move pairs for notation display
  const movePairs: Array<{ w?: string; b?: string }> = [];
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({ w: moves[i]?.san, b: moves[i + 1]?.san });
  }

  return (
    <div className="flex h-screen w-full gap-4 p-4 overflow-hidden relative">

      {/* ── INTRO OVERLAY ─────────────────────────────────────────────── */}
      {status === "intro" && (
        <div className="absolute inset-0 z-30 bg-bg-chess/95 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-8 px-6">

            <div className="flex items-center gap-10">
              <div className="flex flex-col items-center gap-2 min-w-[120px]">
                <div className="w-20 h-20 rounded-2xl bg-primary-chess/20 border-2 border-primary-chess/40 flex items-center justify-center text-3xl font-black text-primary-chess">
                  {playerName[0]?.toUpperCase()}
                </div>
                <p className="font-black text-white text-lg">{playerName}</p>
                <p className="text-gray-500 text-sm">{playerEloVal} ELO</p>
                <span className="text-xs font-bold px-3 py-1 rounded-full border border-white/10 text-gray-400">
                  {playerColor === "white" ? "♔ White" : "♚ Black"}
                </span>
              </div>

              <span className="text-5xl font-black text-gray-700">VS</span>

              <div className="flex flex-col items-center gap-2 min-w-[120px]">
                <div className="w-20 h-20 rounded-2xl bg-primary-chess/20 border-2 border-primary-chess/40 flex items-center justify-center">
                  <Bot size={36} className="text-primary-chess" />
                </div>
                <p className="font-black text-white text-lg">King Bot</p>
                <p className="text-gray-500 text-sm">{botElo} ELO</p>
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${DIFFICULTY_COLORS[difficulty]}`}>
                  {DIFFICULTY_LABELS[difficulty]}
                </span>
              </div>
            </div>

            {whiteTimeMs !== null && (
              <div className="flex items-center gap-2 bg-bg-panel border border-white/10 px-4 py-2 rounded-full text-gray-400 text-sm">
                <Clock size={13} />
                <span>{Math.round(whiteTimeMs / 60000)} min per side</span>
              </div>
            )}

            <button
              onClick={beginPlay}
              className="bg-primary-chess hover:bg-yellow-400 text-black px-14 py-4 rounded-2xl font-black text-xl transition-all hover:scale-105 active:scale-95 shadow-gold"
            >
              Start Game
            </button>

            <button
              onClick={() => router.push("/play")}
              className="text-gray-600 hover:text-gray-400 text-sm transition-colors"
            >
              ← Back to lobby
            </button>
          </div>
        </div>
      )}

      {/* ── BOARD COLUMN ──────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 min-h-0 gap-2">

        {/* Bot bar */}
        <div className="flex justify-between items-center bg-bg-panel border border-white/5 px-3 py-2 rounded-lg shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-chess/15 border border-primary-chess/20 flex items-center justify-center">
              <Bot size={16} className="text-primary-chess" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-200 leading-none">{botName}</p>
              <p className="text-[10px] text-gray-500">{botElo} ELO</p>
            </div>
          </div>
          {botTimeMs !== null ? (
            <div className={`px-3 py-1 rounded font-mono text-lg font-black border transition-colors ${
              botClockActive
                ? botLow
                  ? "bg-red-900/30 border-red-700/40 text-red-400 animate-pulse"
                  : "bg-primary-chess/20 border-primary-chess/30 text-primary-chess"
                : "bg-bg-chess border-white/5 text-gray-500"
            }`}>
              {formatTime(botTimeMs)}
            </div>
          ) : (
            <div className={`px-3 py-1 rounded font-mono text-sm font-bold border ${
              botClockActive
                ? "bg-primary-chess/20 border-primary-chess/30 text-primary-chess animate-pulse"
                : "border-transparent text-transparent"
            }`}>
              {isThinking ? "Thinking…" : ""}
            </div>
          )}
        </div>

        {/* Board container */}
        <div ref={containerRef} className="flex-1 flex items-center justify-center relative min-h-0 min-w-0">
          {(Chessboard as any)({
            options: {
              position: fen,
              onPieceDrop: ({ sourceSquare, targetSquare }: { piece: string; sourceSquare: string; targetSquare: string }) => {
                setSelectedSquare(null);
                setPreMove(null);
                return makePlayerMove(sourceSquare, targetSquare);
              },
              onSquareClick: handleSquareClick,
              boardStyle: { width: `${boardWidth}px`, height: `${boardWidth}px` },
              boardOrientation: isFlipped ? "black" : "white",
              darkSquareStyle:  { backgroundColor: "#b58863" },
              lightSquareStyle: { backgroundColor: "#f0d9b5" },
              squareStyles: customSquareStyles,
              allowDragging: status === "playing" && !isThinking,
            },
          })}

          {/* Thinking pill */}
          {isThinking && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-bg-panel/90 border border-primary-chess/20 px-3 py-1.5 rounded-full flex items-center gap-2 pointer-events-none">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-chess animate-pulse" />
              <span className="text-xs text-gray-400">
                {preMove ? "Pre-move set…" : "Bot thinking…"}
              </span>
            </div>
          )}

          {/* Game-over overlay */}
          {isGameOver && (
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
              <div className="bg-bg-panel border border-white/10 p-8 rounded-2xl flex flex-col items-center gap-5 shadow-xl">
                {status === "won"  && <Trophy size={44} className="text-primary-chess" />}
                {status === "lost" && <X      size={44} className="text-red-400" />}
                {status === "draw" && <Minus  size={44} className="text-gray-400" />}
                <div className="text-center">
                  <p className="text-2xl font-black text-white">
                    {status === "won" ? "You Win!" : status === "lost" ? "You Lost" : "Draw"}
                  </p>
                  {resultReason && <p className="text-sm text-gray-400 mt-1">{resultReason}</p>}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => { resetGame(); startedRef.current = false; }}
                    className="flex items-center gap-2 bg-primary-chess hover:bg-yellow-400 text-black px-5 py-2.5 rounded-xl font-black transition-all hover:scale-105"
                  >
                    <RotateCcw size={16} /> Play Again
                  </button>
                  <button
                    onClick={() => router.push("/play")}
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-gray-300 px-5 py-2.5 rounded-xl font-bold transition-all"
                  >
                    <ArrowLeft size={16} /> Back
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Player bar */}
        <div className="flex justify-between items-center bg-bg-panel border border-white/5 px-3 py-2 rounded-lg shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-chess/20 border border-primary-chess/30 flex items-center justify-center text-xs font-black text-primary-chess">
              {playerName[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">{playerName}</p>
              <p className="text-[10px] text-primary-chess">{playerEloVal} ELO</p>
            </div>
          </div>
          {playerTimeMs !== null ? (
            <div className={`px-3 py-1 rounded font-mono text-lg font-black border transition-colors ${
              playerClockActive
                ? playerLow
                  ? "bg-red-900/30 border-red-700/40 text-red-400 animate-pulse"
                  : "bg-primary-chess/20 border-primary-chess/30 text-primary-chess"
                : "bg-bg-chess border-white/5 text-gray-500"
            }`}>
              {formatTime(playerTimeMs)}
            </div>
          ) : (
            <div className={`px-3 py-1 rounded font-mono text-sm font-bold border ${
              playerClockActive
                ? "bg-primary-chess/20 border-primary-chess/30 text-primary-chess"
                : "border-transparent text-gray-500"
            }`}>
              {status === "playing" ? (isThinking ? "Waiting…" : "Your turn") : ""}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL ───────────────────────────────────────────────── */}
      <div className="w-64 flex flex-col gap-3 shrink-0">
        <button
          onClick={() => router.push("/play")}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft size={14} /> Back to Play
        </button>

        {/* Game info */}
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
          {whiteTimeMs !== null && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Time control</span>
              <span className="text-xs font-bold text-white">
                {Math.round(((whiteTimeMs ?? 0) + (blackTimeMs ?? 0)) / 2 / 60000)} min
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Moves</span>
            <span className="text-xs font-bold text-white">{moves.length}</span>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-bg-panel border border-white/5 rounded-xl p-4 flex flex-col gap-3">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Settings</p>

          {/* Pre-move toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={13} className={preMoveEnabled ? "text-primary-chess" : "text-gray-600"} />
              <span className="text-xs text-gray-400">Pre-move</span>
            </div>
            <button
              onClick={() => {
                setPreMoveEnabled(v => !v);
                if (preMoveEnabled) {
                  setPreMove(null);
                  setSelectedSquare(null);
                  setLegalSquares([]);
                  setCaptureSquares(new Set());
                }
              }}
              className={`relative w-9 h-5 rounded-full transition-colors ${
                preMoveEnabled ? "bg-primary-chess" : "bg-white/10"
              }`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                preMoveEnabled ? "translate-x-4" : "translate-x-0.5"
              }`} />
            </button>
          </div>
          {preMoveEnabled && (
            <p className="text-[10px] text-gray-600 leading-tight">
              Select your next move while the bot thinks. It executes automatically on your turn.
            </p>
          )}
        </div>

        {/* Move history */}
        <div className="bg-bg-panel border border-white/5 rounded-xl flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="px-4 pt-4 pb-2 border-b border-white/5 shrink-0">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Moves</p>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-0.5">
            {movePairs.length === 0 && (
              <p className="text-xs text-gray-600 text-center mt-4 italic">No moves yet</p>
            )}
            {movePairs.map((pair, i) => (
              <div key={i} className="flex gap-1 text-xs font-mono">
                <span className="text-gray-600 w-5 shrink-0">{i + 1}.</span>
                <span className="text-gray-300 w-12">{pair.w ?? ""}</span>
                <span className="text-gray-400 w-12">{pair.b ?? ""}</span>
              </div>
            ))}
            <div ref={movesEndRef} />
          </div>
        </div>

        {(status === "playing" || status === "intro") && (
          <button
            onClick={() => { resetGame(); startedRef.current = false; }}
            className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
          >
            <RotateCcw size={14} /> New Game
          </button>
        )}
      </div>
    </div>
  );
}

export default function BotGamePage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-gray-500">Loading…</div>}>
      <BotGameInner />
    </Suspense>
  );
}
