import { create } from 'zustand';
import { Chess } from 'chess.js';

interface ChessState {
  game: Chess;
  fen: string;
  isGameOver: boolean;
  turn: 'w' | 'b';
  makeMove: (move: { from: string; to: string; promotion?: string }) => boolean;
  resetGame: () => void;
}

export const useChessStore = create<ChessState>((set, get) => {
  const initialGame = new Chess();
  return {
    game: initialGame,
    fen: initialGame.fen(),
    isGameOver: initialGame.isGameOver(),
    turn: initialGame.turn(),
    makeMove: (move) => {
      const { game } = get();
      try {
        const result = game.move(move);
        if (result) {
          set({
            fen: game.fen(),
            isGameOver: game.isGameOver(),
            turn: game.turn()
          });
          return true;
        }
      } catch (e) {
        return false;
      }
      return false;
    },
    resetGame: () => {
      const newGame = new Chess();
      set({
        game: newGame,
        fen: newGame.fen(),
        isGameOver: newGame.isGameOver(),
        turn: newGame.turn()
      });
    }
  };
});
