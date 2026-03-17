import { Search as SearchIcon } from "lucide-react";

export default function SearchPage() {
  return (
    <div className="max-w-3xl mx-auto p-8 flex flex-col items-center text-center">
      <SearchIcon size={48} className="text-primary-chess mb-6 opacity-60" />
      <h1 className="text-4xl font-black text-white mb-3">Search</h1>
      <p className="text-gray-400 text-lg mb-8">Find players, games, puzzles, or tournaments</p>
      <div className="w-full relative">
        <SearchIcon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
        <input 
          autoFocus
          type="text"
          placeholder="Search players, games, tournaments..."
          className="w-full bg-bg-panel border border-gray-700 focus:border-primary-chess rounded-2xl py-4 pl-12 pr-6 text-white text-lg focus:outline-none focus:ring-1 focus:ring-primary-chess transition-colors"
        />
      </div>
      <p className="text-gray-600 text-sm mt-6">Start typing to search across the platform</p>
    </div>
  );
}
