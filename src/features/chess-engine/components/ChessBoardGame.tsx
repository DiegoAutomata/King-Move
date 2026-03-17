"use client";
import { useEffect, useRef, useState } from "react";
import { useChessStore } from "../store/useChessStore";
import { Chessboard } from "react-chessboard";

export function ChessBoardGame() {
  const { fen, makeMove, isGameOver, turn, resetGame } = useChessStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [boardWidth, setBoardWidth] = useState(400);

  useEffect(() => {
    function measure() {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      const size = Math.min(width, height);
      setBoardWidth(Math.max(200, size));
    }

    measure();

    const observer = new ResizeObserver(measure);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  function onDrop(sourceSquare: string, targetSquare: string) {
    return makeMove({ from: sourceSquare, to: targetSquare, promotion: "q" });
  }

  return (
    <div className="flex flex-col w-full h-full items-center justify-center gap-2">

      {/* Opponent bar */}
      <div
        style={{ width: boardWidth }}
        className="flex justify-between items-center bg-bg-panel border border-white/5 px-3 py-2 rounded-lg"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-white/10 flex items-center justify-center text-xs font-bold text-gray-400">?</div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-200 leading-none">Opponent</span>
            <span className="text-[10px] text-gray-600">Waiting...</span>
          </div>
        </div>
        <div className="bg-bg-chess border border-white/5 px-3 py-1 rounded font-mono text-base font-bold text-gray-400">
          10:00
        </div>
      </div>

      {/* Board */}
      <div ref={containerRef} className="flex-1 w-full flex items-center justify-center relative">
        {/* @ts-ignore */}
        {(Chessboard as any)({
          id: "MainBoard",
          position: fen,
          onPieceDrop: onDrop,
          boardWidth: boardWidth,
          customDarkSquareStyle: { backgroundColor: "#b58863" },
          customLightSquareStyle: { backgroundColor: "#f0d9b5" },
        })}

        {isGameOver && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
            <div className="bg-bg-panel border border-primary-chess/30 p-8 rounded-2xl flex flex-col items-center gap-4 shadow-gold">
              <p className="text-3xl font-black text-white">Game Over</p>
              <button
                onClick={resetGame}
                className="bg-primary-chess hover:bg-primary-hover text-black px-8 py-3 rounded-xl font-black transition-all hover:scale-105"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* My bar */}
      <div
        style={{ width: boardWidth }}
        className="flex justify-between items-center bg-bg-panel border border-white/5 px-3 py-2 rounded-lg"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-primary-chess/20 border border-primary-chess/30 flex items-center justify-center text-[10px] font-black text-primary-chess">YOU</div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white leading-none">Player (1200)</span>
            <span className="text-[10px] text-primary-chess">{turn === "w" ? "Your turn ♟" : ""}</span>
          </div>
        </div>
        <div className="bg-bg-chess border border-primary-chess/20 px-3 py-1 rounded font-mono text-base font-bold text-primary-chess">
          10:00
        </div>
      </div>
    </div>
  );
}
