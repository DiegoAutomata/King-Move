"use client";

import { useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Bot, User, SendHorizontal, BrainCircuit } from 'lucide-react';

export default function LearnPage() {
  const [fen, setFen] = useState("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
  const [messages, setMessages] = useState<{ id: string, role: string, content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const newMessages = [...messages, { id: Date.now().toString(), role: 'user', content: input }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, fen })
      });
      // Simplified mock integration logic for now
      setIsLoading(false);
      setMessages([...newMessages, { id: Date.now().toString() + "a", role: 'assistant', content: "Analisando posición..." }]);
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full">
      {/* Left Area - Video / Board analysis */}
      <div className="flex-1 min-h-0 bg-bg-chess flex flex-col p-8 border-r border-gray-800">
        <h1 className="text-3xl font-black text-white mb-6 flex items-center gap-3">
          <BrainCircuit className="text-primary-chess" size={32} />
          AI Grandmaster Tutor
        </h1>
        
        <div className="bg-bg-sidebar p-4 border border-gray-800 rounded-xl mb-6">
          <label className="text-sm font-semibold text-gray-400 mb-2 block">
            Analyze Position (FEN format)
          </label>
          <input 
            type="text" 
            value={fen}
            onChange={(e) => setFen(e.target.value)}
            className="w-full bg-bg-panel border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-chess focus:ring-1 focus:ring-primary-chess font-mono text-sm"
          />
        </div>

        <div className="flex-1 flex justify-center items-center">
          <div className="w-full max-w-lg aspect-square">
            {/* @ts-ignore */}
            {(Chessboard as any)({
              position: fen,
              customDarkSquareStyle: { backgroundColor: "#779556" },
              customLightSquareStyle: { backgroundColor: "#ebecd0" }
            })}
          </div>
        </div>
      </div>

      {/* Right Sidebar - Chat Interface */}
      <div className="w-full md:w-80 lg:w-[400px] bg-bg-sidebar h-full flex flex-col shadow-xl z-10 shrink-0">
        <div className="bg-bg-panel border-b border-gray-800 p-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Ask Grandmaster AI
          </h2>
          <p className="text-xs text-gray-400">Powered by OpenRouter</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 my-auto p-6">
              <Bot size={48} className="mx-auto mb-4 opacity-20" />
              <p>Hi! I'm your AI Tutor. Describe what you're struggling with or ask about the current position.</p>
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${
                  m.role === 'user' ? 'bg-primary-chess' : 'bg-purple-600'
                }`}>
                  {m.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
                </div>
                <div className={`p-3 rounded-xl max-w-[80%] text-sm ${
                  m.role === 'user' 
                    ? 'bg-bg-panel border border-gray-700 text-white rounded-tr-sm' 
                    : 'bg-primary-chess/10 border border-primary-chess/30 text-gray-200 rounded-tl-sm'
                }`}>
                  {m.content}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex gap-3 flex-row">
              <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-purple-600">
                <Bot size={16} className="text-white" />
              </div>
              <div className="p-3 rounded-xl max-w-[80%] text-sm bg-primary-chess/10 border border-primary-chess/30 text-gray-200 rounded-tl-sm animate-pulse">
                Thinking...
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleCustomSubmit} className="p-4 bg-bg-panel border-t border-gray-800 p-4 shrink-0">
          <div className="relative">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Why is Nf3 the best move here?"
              className="w-full bg-bg-sidebar border border-gray-700 rounded-2xl py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-primary-chess focus:ring-1 focus:ring-primary-chess"
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-primary-chess text-white rounded-xl hover:bg-primary-hover disabled:opacity-50 transition-colors"
            >
              <SendHorizontal size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
