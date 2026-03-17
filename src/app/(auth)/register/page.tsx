"use client";
import Link from 'next/link';
import { useState } from 'react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Supabase Auth integration mock
    setTimeout(() => {
      setLoading(false);
      window.location.href = '/';
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-chess text-white p-4">
      <div className="w-full max-w-md bg-bg-panel border border-gray-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary-chess flex items-center justify-center mb-4">
            <span className="text-bg-sidebar font-bold text-2xl">C</span>
          </div>
          <h1 className="text-3xl font-black">Create Account</h1>
          <p className="text-gray-400 mt-2">Join the #1 platform for real money chess.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-bg-sidebar border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-chess focus:ring-1 focus:ring-primary-chess transition-colors"
              placeholder="chessking99"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-bg-sidebar border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-chess focus:ring-1 focus:ring-primary-chess transition-colors"
              placeholder="grandmaster@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-bg-sidebar border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-chess focus:ring-1 focus:ring-primary-chess transition-colors"
              placeholder="••••••••"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary-chess hover:bg-primary-hover text-white font-bold text-lg py-3 rounded-lg mt-4 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-gray-400 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-primary-chess hover:text-primary-hover font-semibold transition-colors">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
