import { Puzzle, Zap, Trophy, Clock } from "lucide-react";

const puzzles = [
  { id: 1, title: "The Fork", rating: 1150, type: "Tactics", time: "5 min", solved: 24302, color: "bg-green-900/40 border-green-500/20" },
  { id: 2, title: "Back Rank Mate", rating: 1280, type: "Mate in 2", time: "3 min", solved: 18750, color: "bg-blue-900/40 border-blue-500/20" },
  { id: 3, title: "Skewer Attack", rating: 1420, type: "Tactics", time: "7 min", solved: 9841, color: "bg-yellow-900/40 border-yellow-500/20" },
  { id: 4, title: "Queen Sacrifice", rating: 1650, type: "Mate in 3", time: "10 min", solved: 4201, color: "bg-red-900/40 border-red-500/20" },
  { id: 5, title: "Discovered Attack", rating: 1300, type: "Tactics", time: "5 min", solved: 12900, color: "bg-purple-900/40 border-purple-500/20" },
  { id: 6, title: "Zugzwang", rating: 1800, type: "Endgame", time: "15 min", solved: 2100, color: "bg-orange-900/40 border-orange-500/20" },
];

export default function PuzzlesPage() {
  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-black text-white flex items-center gap-3 mb-2">
            <Puzzle className="text-primary-chess" size={36} />
            Puzzles
          </h1>
          <p className="text-gray-400 font-medium">Train your tactics. Sharpen your mind.</p>
        </div>
        <div className="hidden md:flex gap-6 text-center">
          <div className="bg-bg-panel border border-gray-800 rounded-xl px-6 py-3">
            <p className="text-2xl font-black text-white">1,340</p>
            <p className="text-xs text-gray-500 font-semibold uppercase mt-1">Your Rating</p>
          </div>
          <div className="bg-bg-panel border border-gray-800 rounded-xl px-6 py-3">
            <p className="text-2xl font-black text-primary-chess">126</p>
            <p className="text-xs text-gray-500 font-semibold uppercase mt-1">Solved</p>
          </div>
        </div>
      </div>

      {/* Puzzle Rush CTA */}
      <div className="bg-gradient-to-r from-primary-chess/20 to-transparent border border-primary-chess/30 rounded-2xl p-6 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary-chess/20 rounded-xl flex items-center justify-center">
            <Zap className="text-primary-chess" size={28} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Puzzle Rush</h2>
            <p className="text-gray-400 text-sm">Solve as many puzzles as you can in 5 minutes</p>
          </div>
        </div>
        <button className="bg-primary-chess hover:bg-primary-hover text-white font-bold py-3 px-6 rounded-xl transition-all hover:scale-105 active:scale-95">
          Start Rush
        </button>
      </div>

      {/* Puzzle Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {puzzles.map((puzzle) => (
          <div key={puzzle.id} className={`${puzzle.color} border rounded-xl p-5 hover:-translate-y-1 transition-transform cursor-pointer`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">{puzzle.title}</h3>
                <span className="text-xs bg-black/30 text-gray-300 px-2 py-0.5 rounded font-semibold mt-1 inline-block">
                  {puzzle.type}
                </span>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 font-semibold">Rating</p>
                <p className="text-xl font-black text-white">{puzzle.rating}</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span className="flex items-center gap-1"><Clock size={14} /> {puzzle.time}</span>
              <span className="flex items-center gap-1"><Trophy size={14} /> {puzzle.solved.toLocaleString()} solved</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
