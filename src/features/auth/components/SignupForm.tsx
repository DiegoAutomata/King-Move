'use client'

import { useState } from 'react'
import { signup } from '@/actions/auth'
import { GoogleSignInButton } from './GoogleSignInButton'
import { AuthDivider } from './AuthDivider'

export function SignupForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await signup(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <GoogleSignInButton label="Sign up with Google" />
      <AuthDivider />

      <form action={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-gray-300 mb-1.5">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="grandmaster@example.com"
            className="w-full bg-bg-chess border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-primary-chess focus:ring-1 focus:ring-primary-chess transition-colors"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-gray-300 mb-1.5">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="Min. 6 characters"
            className="w-full bg-bg-chess border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-primary-chess focus:ring-1 focus:ring-primary-chess transition-colors"
          />
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-900/20 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-chess hover:bg-primary-hover text-black font-black text-base py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-gold disabled:opacity-50 disabled:scale-100 mt-2"
        >
          {loading ? 'Creating account...' : 'Create Free Account'}
        </button>

        <p className="text-center text-xs text-gray-600 leading-relaxed">
          By creating an account you agree to our Terms of Service and Privacy Policy.
        </p>
      </form>
    </div>
  )
}
