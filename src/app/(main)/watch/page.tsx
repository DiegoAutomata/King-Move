import { MonitorPlay, Radio, Users, Calendar } from "lucide-react";

const liveGames = [
  { white: "Magnus C.", black: "Hikaru N.", rating: "2850 vs 2820", viewers: 14200, time: "Blitz 3+2" },
  { white: "Fabiano C.", black: "Ding L.", rating: "2800 vs 2810", viewers: 9800, time: "Rapid 15+10" },
  { white: "Wesley S.", black: "Anish G.", rating: "2770 vs 2760", viewers: 5400, time: "Classical" },
  { white: "Ian N.", black: "Alireza F.", rating: "2780 vs 2790", viewers: 3200, time: "Blitz 3+0" },
];

const upcomingEvents = [
  { name: "ChessCash Weekly Open", prize: "$500", date: "Sat, Mar 21", players: 128 },
  { name: "Blitz Brawl Saturday", prize: "$200", date: "Sat, Mar 21", players: 64 },
  { name: "Grandmaster Invitational", prize: "$5,000", date: "Mon, Mar 23", players: 16 },
];

export default function WatchPage() {
  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="flex items-center gap-3 mb-10">
        <MonitorPlay className="text-primary-chess" size={36} />
        <div>
          <h1 className="text-4xl font-black text-white">Watch</h1>
          <p className="text-gray-400 font-medium">Live games, top events, and tournaments</p>
        </div>
      </div>

      {/* Live now section */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
          <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse inline-block"></span>
          Live Now
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {liveGames.map((game, i) => (
            <div key={i} className="bg-bg-panel border border-gray-800 hover:border-gray-600 rounded-xl p-5 cursor-pointer transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-bold text-white text-lg">{game.white} <span className="text-gray-500">vs</span> {game.black}</p>
                  <p className="text-sm text-gray-400 mt-1">{game.rating}</p>
                </div>
                <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-1 rounded border border-red-500/30">LIVE</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span className="bg-bg-sidebar px-2 py-1 rounded text-gray-400">{game.time}</span>
                <span className="flex items-center gap-1">
                  <Users size={14} />
                  {game.viewers.toLocaleString()} watching
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming events */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
          <Calendar size={20} className="text-primary-chess" />
          Upcoming Tournaments
        </h2>
        <div className="bg-bg-panel border border-gray-800 rounded-2xl overflow-hidden">
          {upcomingEvents.map((event, i) => (
            <div key={i} className={`p-5 flex items-center justify-between ${i < upcomingEvents.length - 1 ? 'border-b border-gray-800' : ''} hover:bg-bg-hover transition-colors`}>
              <div>
                <p className="font-bold text-white text-lg">{event.name}</p>
                <p className="text-sm text-gray-400 mt-1">{event.date} · {event.players} players</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-primary-chess">{event.prize}</p>
                <button className="mt-2 text-xs bg-primary-chess/20 hover:bg-primary-chess/40 border border-primary-chess/30 text-primary-chess font-bold px-3 py-1 rounded-lg transition-colors">
                  Register
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
