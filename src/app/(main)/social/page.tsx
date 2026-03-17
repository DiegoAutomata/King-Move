import { Users, Trophy, TrendingUp, Crown } from "lucide-react";

const leaderboard = [
  { rank: 1, name: "ChessShark99", elo: 2240, wins: 148, earnings: "$4,200" },
  { rank: 2, name: "QueenSlayer", elo: 2190, wins: 132, earnings: "$3,100" },
  { rank: 3, name: "PawnHubCEO", elo: 2150, wins: 119, earnings: "$2,800" },
  { rank: 4, name: "Endgame_King", elo: 2100, wins: 104, earnings: "$1,950" },
  { rank: 5, name: "BlitzMaster", elo: 2060, wins: 98, earnings: "$1,400" },
  { rank: 6, name: "KnightRider", elo: 2020, wins: 87, earnings: "$980" },
  { rank: 7, name: "RookieLuck", elo: 1980, wins: 76, earnings: "$740" },
  { rank: 8, name: "SilentBishop", elo: 1940, wins: 65, earnings: "$520" },
];

export default function SocialPage() {
  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="flex items-center gap-3 mb-10">
        <Users className="text-primary-chess" size={36} />
        <div>
          <h1 className="text-4xl font-black text-white">Community</h1>
          <p className="text-gray-400 font-medium">Top players, clubs, and global leaderboards</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Leaderboard */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
            <Crown className="text-yellow-500" size={20} />
            Monthly Leaderboard
          </h2>
          <div className="bg-bg-panel border border-gray-800 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-4 px-5 py-3 bg-bg-sidebar border-b border-gray-800 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <span>Rank</span>
              <span>Player</span>
              <span className="text-center">ELO</span>
              <span className="text-right">Earnings</span>
            </div>
            {leaderboard.map((player) => (
              <div key={player.rank} className="grid grid-cols-4 items-center px-5 py-4 border-b border-gray-800 last:border-0 hover:bg-bg-hover transition-colors">
                <span className={`font-black text-lg ${player.rank === 1 ? 'text-yellow-400' : player.rank === 2 ? 'text-gray-300' : player.rank === 3 ? 'text-orange-400' : 'text-gray-600'}`}>
                  #{player.rank}
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-sm bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-300">
                    {player.name[0]}
                  </div>
                  <span className="font-semibold text-gray-200">{player.name}</span>
                </div>
                <div className="text-center">
                  <span className="font-bold text-white">{player.elo}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-primary-chess">{player.earnings}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right side: Stats */}
        <div className="flex flex-col gap-4">
          <div className="bg-bg-panel border border-gray-800 rounded-xl p-5">
            <h3 className="font-bold text-gray-400 text-sm uppercase flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-primary-chess" /> Global Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Active Players</span>
                <span className="font-bold text-white">12,480</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Games Today</span>
                <span className="font-bold text-white">48,320</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Cash Wagered</span>
                <span className="font-bold text-primary-chess">$24,100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Prize Pool</span>
                <span className="font-bold text-primary-chess">$2.1M</span>
              </div>
            </div>
          </div>

          <div className="bg-bg-panel border border-gray-800 rounded-xl p-5">
            <h3 className="font-bold text-gray-400 text-sm uppercase flex items-center gap-2 mb-4">
              <Trophy size={16} className="text-yellow-500" /> Your Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Your ELO</span>
                <span className="font-bold text-white">1,200</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Win Rate</span>
                <span className="font-bold text-green-400">54%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Earned</span>
                <span className="font-bold text-primary-chess">$0.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Games Played</span>
                <span className="font-bold text-white">0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
