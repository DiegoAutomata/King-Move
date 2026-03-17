import Link from 'next/link';
import { DollarSign, ShieldCheck, Trophy, ArrowUpRight, Zap, Users, Play } from 'lucide-react';

export default function CashGames() {
  return (
    <div className="max-w-5xl mx-auto py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12 border-b border-bg-hover/50 pb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mb-2 flex items-center gap-3">
            <DollarSign className="w-10 h-10 text-yellow-500" />
            Cash Games
          </h1>
          <p className="text-gray-400 font-medium text-lg">
            Monetiza tu habilidad. Partidas justas, pagos instantáneos.
          </p>
        </div>
        
        <div className="bg-bg-panel border border-yellow-500/20 rounded-2xl p-4 flex items-center gap-6 min-w-[280px]">
          <div>
            <p className="text-gray-400 text-sm font-semibold mb-1">Mi Balance (USD)</p>
            <p className="text-3xl font-black text-white">$145.50</p>
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <button className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2 px-4 rounded-lg w-full transition-colors flex justify-center items-center gap-1 shadow-[0_4px_0_0_#9c7717] active:translate-y-[4px] active:shadow-none">
               Depositar <ArrowUpRight className="w-4 h-4"/>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Main Content: Lobbies and Games */}
        <div className="flex-1 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LobbyCard 
                    title="Partida Rápida" 
                    time="10 min" 
                    bet="$5.00" 
                    players={24}
                    color="green"
                />
                <LobbyCard 
                    title="Blitz" 
                    time="3 min + 2s" 
                    bet="$10.00" 
                    players={86}
                    color="yellow"
                />
                <LobbyCard 
                    title="Bala (Bullet)" 
                    time="1 min" 
                    bet="$2.00" 
                    players={134}
                    color="red"
                />
                <LobbyCard 
                    title="High Roller" 
                    time="15 min" 
                    bet="$100.00" 
                    players={4}
                    color="purple"
                    isVip
                />
            </div>

            <div className="bg-bg-panel rounded-2xl overflow-hidden border border-bg-hover">
                <div className="p-4 bg-[#282622] border-b border-bg-hover flex justify-between items-center">
                    <h3 className="font-bold text-lg text-white">Retos Abiertos</h3>
                    <button className="text-sm font-bold text-yellow-500 hover:text-yellow-400">Ver Todos</button>
                </div>
                <div className="divide-y divide-bg-hover">
                    {[1,2,3,4].map((i) => (
                        <div key={i} className="p-4 hover:bg-bg-hover/50 transition-colors flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-gray-600 rounded-sm"></div>
                                <div>
                                    <p className="font-bold text-white flex items-center gap-2">
                                        MagnusHustler 
                                        <span className="text-xs bg-bg-hover px-2 py-0.5 rounded text-gray-400">Elo 1850</span>
                                    </p>
                                    <p className="text-sm text-gray-400 mt-0.5 px-1">Blitz 5 min</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Apuesta</p>
                                    <p className="font-black text-xl text-yellow-500">${(i*5).toFixed(2)}</p>
                                </div>
                                <button className="bg-white hover:bg-gray-200 text-black font-bold py-2 px-6 rounded-lg transition-colors shadow-[0_4px_0_0_#9ca3af] active:translate-y-[4px] active:shadow-none">
                                    Aceptar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Right Sidebar: Trust & Stats */}
        <div className="w-full lg:w-80 flex flex-col gap-4">
            <button className="w-full bg-primary-chess hover:bg-primary-hover shadow-[0_6px_0_0_#4c7b28] text-white p-4 rounded-xl font-extrabold text-xl transition-all active:translate-y-[6px] active:shadow-none mb-4">
                Crear Reto Personalizado
            </button>

            <div className="bg-bg-panel rounded-2xl p-5 border border-bg-hover space-y-4">
                <div className="flex items-center gap-3 text-white mb-2">
                    <ShieldCheck className="text-green-500 w-6 h-6" />
                    <h3 className="font-bold text-lg">Safe Play System</h3>
                </div>
                <p className="text-sm text-gray-400 font-medium">
                    Aseguramos la integridad de cada partida Monetaria usando el mismo motor anti-trampas de nivel torneo que bloquea el uso de módulos o IA.
                </p>
                <div className="pt-2 border-t border-bg-hover text-xs text-gray-500 font-bold flex gap-2">
                    <Zap className="w-4 h-4 text-gray-400" /> Fondos resguardados en custodia (Escrow).
                </div>
            </div>

            <div className="bg-bg-panel rounded-2xl p-5 border border-bg-hover">
                 <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
                    <Trophy className="text-yellow-500 w-5 h-5"/>
                    Top Ganadores (Hoy)
                 </h3>
                 <div className="space-y-3">
                    <WinnerRow rank={1} name="ChessShark99" amount="+$450.00" />
                    <WinnerRow rank={2} name="QueenSlayer" amount="+$320.50" />
                    <WinnerRow rank={3} name="PawnHubCEO" amount="+$210.00" />
                 </div>
            </div>
        </div>

      </div>
    </div>
  )
}

function LobbyCard({ title, time, bet, players, color, isVip }: { title: string, time: string, bet: string, players: number, color: string, isVip?: boolean }) {
    
    // Simplificando los colores para tailwind v4 / clases puras
    const bgColors: any = {
        green: 'bg-[#3e5229]',
        yellow: 'bg-[#5c4a16]',
        red: 'bg-[#5c2316]',
        purple: 'bg-[#3b165c]'
    };

    return (
        <div className={`p-5 rounded-2xl ${bgColors[color]} border border-white/5 relative overflow-hidden group cursor-pointer hover:-translate-y-1 transition-transform`}>
            {isVip && (
                <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[10px] font-black uppercase px-3 py-1 rounded-bl-lg">
                    VIP
                </div>
            )}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-white font-extrabold text-xl">{title}</h3>
                    <p className="text-gray-300/80 font-bold text-sm flex items-center gap-1 mt-1">
                        <Zap className="w-3 h-3" /> {time}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-white/60 font-bold uppercase tracking-wide">Buy-in</p>
                    <p className="text-2xl font-black text-white">{bet}</p>
                </div>
            </div>
            
            <div className="flex items-center justify-between mt-6">
                <span className="text-xs font-semibold text-white/50 flex items-center gap-1">
                    <Users className="w-3 h-3" /> {players} online
                </span>
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white text-white group-hover:text-black transition-colors">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
            </div>
        </div>
    )
}

function WinnerRow({ rank, name, amount }: { rank: number, name: string, amount: string }) {
    return (
        <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
                <span className={`font-black ${rank === 1 ? 'text-yellow-500' : 'text-gray-500'}`}>#{rank}</span>
                <span className="font-bold text-gray-200">{name}</span>
            </div>
            <span className="font-bold text-green-400">{amount}</span>
        </div>
    )
}
