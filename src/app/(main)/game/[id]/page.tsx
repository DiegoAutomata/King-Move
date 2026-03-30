"use client";

import { use, useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Chessboard } from "react-chessboard";
import { Crown, Flag, Loader2, ArrowLeft, Clock, BookOpen, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { checkComebackKing } from "@/actions/achievements";
import { useOnlineGame } from "@/features/chess-engine/hooks/useOnlineGame";
import { useGameClock } from "@/features/chess-engine/hooks/useGameClock";

export default function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: gameId } = use(params);
  const router = useRouter();
  const { user, profile } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const movesEndRef = useRef<HTMLDivElement>(null);
  const [boardWidth, setBoardWidth] = useState(400);
  const [showResignConfirm, setShowResignConfirm] = useState(false);
  const [comebackToast, setComebackToast] = useState(false);
  const [, startAchievementCheck] = useTransition();
  const checkedComebackRef = useRef(false);

  const {
    fen,
    moves,
    myColor,
    isMyTurn,
    isWhiteTurn,
    status,
    result,
    lastMove,
    whitePlayer,
    blackPlayer,
    betAmount,
    gameType,
    whiteTimeMs,
    blackTimeMs,
    lastMoveAt,
    loading,
    error,
    makeMove,
    resign,
    flagTimeout,
  } = useOnlineGame(gameId, user?.id ?? "");

  // Auto-scroll al último movimiento
  useEffect(() => {
    movesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [moves.length]);

  // Comeback King check cuando la partida termina con victoria
  useEffect(() => {
    if (status === "finished" && result && result !== "draw" && !checkedComebackRef.current) {
      checkedComebackRef.current = true;
      startAchievementCheck(async () => {
        const res = await checkComebackKing(gameId);
        if (res.awarded) setComebackToast(true);
      });
    }
  }, [status, result, gameId]);

  // Agrupar moves en pares (blancas + negras) para mostrar como 1. e4 e5
  const movePairs = moves.reduce<{ white: string; black?: string; num: number }[]>((acc, move, i) => {
    if (i % 2 === 0) {
      acc.push({ num: Math.floor(i / 2) + 1, white: move.san });
    } else {
      acc[acc.length - 1].black = move.san;
    }
    return acc;
  }, []);
  const lastMoveIdx = moves.length - 1;

  // Callback estable para timeout
  const handleTimeout = useCallback(async (_loser: "white" | "black") => {
    await flagTimeout();
  }, [flagTimeout]);

  const { whiteDisplay, blackDisplay, whiteLow, blackLow } = useGameClock({
    whiteTimeMs,
    blackTimeMs,
    lastMoveAt,
    isWhiteTurn,
    status,
    onTimeout: handleTimeout,
  });

  // Reloj visible solo si la BD ya tiene tiempos
  const hasClock = whiteTimeMs !== null;

  // Responsive board
  useEffect(() => {
    function measure() {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      setBoardWidth(Math.max(200, Math.min(width, height) - 8));
    }
    measure();
    const observer = new ResizeObserver(measure);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  function onDrop(sourceSquare: string, targetSquare: string) {
    makeMove(sourceSquare, targetSquare);
    return true;
  }

  const opponent = myColor === "white" ? blackPlayer : whitePlayer;
  const me = myColor === "white" ? whitePlayer : blackPlayer;
  const opponentName = opponent?.name?.split("@")[0] ?? "Opponent";
  const myName = me?.name?.split("@")[0] ?? profile?.full_name ?? "You";

  const isOpponentWhite = myColor === "black";
  const opponentClockDisplay = isOpponentWhite ? whiteDisplay : blackDisplay;
  const myClockDisplay = isOpponentWhite ? blackDisplay : whiteDisplay;
  const opponentLow = isOpponentWhite ? whiteLow : blackLow;
  const myLow = isOpponentWhite ? blackLow : whiteLow;
  const opponentTicking = status === "active" && !isMyTurn;
  const myTicking = status === "active" && isMyTurn;

  const resultText = () => {
    if (!result) return null;
    if (result === "draw") return "Draw!";
    if (myColor === result) return "You won! 🏆";
    return "You lost.";
  };

  const customSquareStyles: Record<string, React.CSSProperties> = {};
  if (lastMove) {
    customSquareStyles[lastMove.from] = { backgroundColor: "rgba(255, 214, 10, 0.35)" };
    customSquareStyles[lastMove.to] = { backgroundColor: "rgba(255, 214, 10, 0.5)" };
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary-chess" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-red-400 font-bold">{error}</p>
        <button onClick={() => router.push("/play")} className="text-primary-chess underline text-sm">
          Back to Play
        </button>
      </div>
    );
  }

  if (status === "waiting") {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-6">
        <Loader2 size={40} className="animate-spin text-primary-chess" />
        <p className="text-xl font-black text-white">Waiting for opponent...</p>
        <p className="text-sm text-gray-500">Share this URL or wait for matchmaking</p>
        <button
          onClick={() => { resign(); router.push("/play"); }}
          className="text-gray-500 hover:text-gray-300 text-sm underline"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">

      {/* ── Main: Board ── */}
      <div className="flex-1 min-w-0 bg-bg-chess flex items-center justify-center p-3 overflow-hidden">
        <div ref={containerRef} className="w-full h-full flex flex-col items-center justify-center gap-2 max-w-[700px]">

          {/* Opponent bar */}
          <div style={{ width: boardWidth }} className="flex justify-between items-center bg-bg-panel border border-white/5 px-3 py-2 rounded-lg shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-gray-400">
                {opponentName[0]?.toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-200 leading-none">{opponentName}</span>
                <span className="text-[10px] text-gray-500">{opponent?.elo ?? "?"} ELO</span>
              </div>
            </div>
            {hasClock ? (
              <div className={`px-3 py-1 rounded font-mono text-lg font-black border transition-colors ${
                opponentTicking
                  ? opponentLow
                    ? "bg-red-900/30 border-red-700/40 text-red-400 animate-pulse"
                    : "bg-primary-chess/20 border-primary-chess/30 text-primary-chess"
                  : "bg-bg-chess border-white/5 text-gray-500"
              }`}>
                {opponentClockDisplay}
              </div>
            ) : (
              <div className={`px-3 py-1 rounded font-mono text-sm font-bold border ${
                opponentTicking
                  ? "bg-primary-chess/20 border-primary-chess/30 text-primary-chess animate-pulse"
                  : "bg-bg-chess border-white/5 text-gray-500"
              }`}>
                {opponentTicking ? "Thinking..." : ""}
              </div>
            )}
          </div>

          {/* Board */}
          <div className="relative flex items-center justify-center">
            {(Chessboard as any)({
              id: "OnlineGame",
              position: fen,
              onPieceDrop: onDrop,
              boardWidth,
              boardOrientation: myColor ?? "white",
              arePiecesDraggable: isMyTurn && status === "active",
              customDarkSquareStyle: { backgroundColor: "#b58863" },
              customLightSquareStyle: { backgroundColor: "#f0d9b5" },
              customSquareStyles,
            })}

            {/* Comeback King toast */}
            {comebackToast && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-yellow-900/90 border border-yellow-500/40 text-yellow-300 font-bold px-5 py-3 rounded-xl flex items-center gap-2 shadow-lg animate-bounce">
                <Sparkles size={16} className="text-yellow-400" />
                👑 Comeback King unlocked! +100 XP
              </div>
            )}

            {/* Result overlay */}
            {status === "finished" && (
              <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-10 rounded">
                <div className="bg-bg-panel border border-primary-chess/30 p-8 rounded-2xl flex flex-col items-center gap-4 shadow-gold text-center">
                  <p className="text-4xl font-black text-white">{resultText()}</p>
                  {gameType === "token" && betAmount > 0 && result === myColor && (
                    <p className="text-green-400 font-bold text-lg">
                      +⬡{(betAmount * 1.95).toFixed(0)} $KING
                    </p>
                  )}
                  {gameType === "token" && betAmount > 0 && result !== myColor && result !== "draw" && (
                    <p className="text-red-400 font-bold">-⬡{betAmount.toFixed(0)} $KING</p>
                  )}
                  <div className="flex gap-3 mt-2 flex-wrap justify-center">
                    <button
                      onClick={() => router.push("/play")}
                      className="bg-primary-chess hover:bg-primary-hover text-black px-8 py-3 rounded-xl font-black transition-all hover:scale-105"
                    >
                      Play Again
                    </button>
                    <button
                      onClick={() => router.push(`/game/${gameId}/analysis`)}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 px-5 py-3 rounded-xl font-bold transition-all text-sm flex items-center gap-2"
                    >
                      <BookOpen size={14} /> Analyze
                    </button>
                    <button
                      onClick={() => router.push("/social")}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 px-5 py-3 rounded-xl font-bold transition-all text-sm"
                    >
                      History
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* My bar */}
          <div style={{ width: boardWidth }} className="flex justify-between items-center bg-bg-panel border border-white/5 px-3 py-2 rounded-lg shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-chess/20 border border-primary-chess/30 flex items-center justify-center text-[10px] font-black text-primary-chess">
                {myName[0]?.toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white leading-none">{myName}</span>
                <span className="text-[10px] text-primary-chess">{profile?.elo ?? me?.elo ?? 1200} ELO</span>
              </div>
            </div>
            {hasClock ? (
              <div className={`px-3 py-1 rounded font-mono text-lg font-black border transition-colors ${
                myTicking
                  ? myLow
                    ? "bg-red-900/30 border-red-700/40 text-red-400 animate-pulse"
                    : "bg-primary-chess/20 border-primary-chess/30 text-primary-chess"
                  : "bg-bg-chess border-white/5 text-gray-500"
              }`}>
                {myClockDisplay}
              </div>
            ) : (
              <div className={`px-3 py-1 rounded font-mono text-sm font-bold border ${
                myTicking
                  ? "bg-primary-chess/20 border-primary-chess/30 text-primary-chess"
                  : "bg-bg-chess border-white/5 text-gray-500"
              }`}>
                {myTicking ? "Your turn" : ""}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="w-64 bg-bg-sidebar border-l border-white/5 flex flex-col p-4 gap-4 shrink-0">

        <button
          onClick={() => router.push("/play")}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm font-semibold transition-colors"
        >
          <ArrowLeft size={16} /> Back to lobby
        </button>

        {/* Game info */}
        <div className="bg-bg-panel border border-white/5 rounded-xl p-4 flex flex-col gap-2">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Game Info</p>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Mode</span>
            <span className={`font-bold ${gameType === "token" ? "text-yellow-400" : "text-gray-300"}`}>
              {gameType === "token" ? "⬡ Token" : "Free"}
            </span>
          </div>
          {gameType === "token" && betAmount > 0 && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Bet</span>
                <span className="font-bold text-white">⬡{betAmount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Prize</span>
                <span className="font-bold text-green-400">⬡{(betAmount * 1.95).toFixed(0)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Your color</span>
            <span className="font-bold text-gray-200 capitalize">{myColor ?? "—"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Status</span>
            <span className={`font-bold capitalize ${
              status === "active" ? "text-green-400" :
              status === "finished" ? "text-gray-400" :
              "text-yellow-400"
            }`}>{status}</span>
          </div>
        </div>

        {/* Clock legend */}
        {hasClock && status === "active" && (
          <div className="bg-bg-panel border border-white/5 rounded-xl p-3 flex flex-col gap-2">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={11} /> Clocks
            </p>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">White</span>
              <span className={`font-mono font-bold ${isWhiteTurn ? "text-white" : "text-gray-500"}`}>{whiteDisplay}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Black</span>
              <span className={`font-mono font-bold ${!isWhiteTurn ? "text-white" : "text-gray-500"}`}>{blackDisplay}</span>
            </div>
          </div>
        )}

        {/* Move history */}
        <div className="bg-bg-panel border border-white/5 rounded-xl p-3 flex flex-col gap-2 flex-1 min-h-0">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider flex items-center gap-1.5 shrink-0">
            <BookOpen size={11} /> Moves {moves.length > 0 && <span className="text-gray-600">({moves.length})</span>}
          </p>
          {movePairs.length === 0 ? (
            <p className="text-xs text-gray-600 italic">No moves yet</p>
          ) : (
            <div className="overflow-y-auto flex-1 min-h-0 max-h-48 scrollbar-none">
              <div className="space-y-0.5">
                {movePairs.map((pair) => {
                  const whiteIdx = (pair.num - 1) * 2;
                  const blackIdx = whiteIdx + 1;
                  return (
                    <div key={pair.num} className="flex gap-1 text-xs font-mono">
                      <span className="text-gray-600 w-6 shrink-0">{pair.num}.</span>
                      <span className={`w-12 font-semibold ${whiteIdx === lastMoveIdx ? "text-primary-chess" : "text-gray-300"}`}>
                        {pair.white}
                      </span>
                      {pair.black && (
                        <span className={`w-12 ${blackIdx === lastMoveIdx ? "text-primary-chess font-semibold" : "text-gray-400"}`}>
                          {pair.black}
                        </span>
                      )}
                    </div>
                  );
                })}
                <div ref={movesEndRef} />
              </div>
            </div>
          )}
        </div>

        {/* Resign */}
        {status === "active" && (
          <div className="mt-auto">
            {!showResignConfirm ? (
              <button
                onClick={() => setShowResignConfirm(true)}
                className="w-full flex items-center justify-center gap-2 bg-red-900/20 hover:bg-red-900/40 border border-red-800/40 text-red-400 font-bold py-2.5 rounded-xl transition-all text-sm"
              >
                <Flag size={14} /> Resign
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-gray-400 text-center">Are you sure?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowResignConfirm(false)}
                    className="flex-1 bg-white/5 border border-white/10 text-gray-400 font-bold py-2 rounded-lg text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => { resign(); setShowResignConfirm(false); }}
                    className="flex-1 bg-red-900/40 border border-red-700/40 text-red-400 font-bold py-2 rounded-lg text-sm"
                  >
                    Resign
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {status === "finished" && (
          <div className="mt-auto">
            <button
              onClick={() => router.push("/play")}
              className="w-full bg-primary-chess hover:bg-primary-hover text-black font-black py-3 rounded-xl flex items-center justify-center gap-2"
            >
              <Crown size={16} /> Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
