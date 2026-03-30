'use client'

import { useState } from 'react'
import { resetPassword } from '@/actions/auth'
import { Mail, CheckCircle } from 'lucide-react'

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await resetPassword(formData)
    if (result?.error) {
      setError(result.error)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
          <CheckCircle size={28} className="text-green-400" />
        </div>
        <div>
          <p className="text-white font-black text-lg">Check your inbox</p>
          <p className="text-gray-400 text-sm mt-1">
            We sent a password reset link to your email.
          </p>
        </div>
        <p className="text-xs text-gray-600">
          Didn't get it? Check your spam folder or try again.
        </p>
      </div>
    )
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-gray-300 mb-1.5">
          Email address
        </label>
        <div className="relative">
          <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="grandmaster@example.com"
            className="w-full bg-bg-chess border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-primary-chess focus:ring-1 focus:ring-primary-chess transition-colors"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-900/20 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary-chess hover:bg-primary-hover text-black font-black text-base py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-gold disabled:opacity-50 disabled:scale-100"
      >
        {loading ? 'Sending...' : 'Send reset link'}
      </button>
    </form>
  )
}
