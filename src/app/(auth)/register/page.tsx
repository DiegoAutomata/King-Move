import Link from 'next/link'
import { Crown } from 'lucide-react'
import { SignupForm } from '@/features/auth/components'

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-chess text-white p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary-chess flex items-center justify-center mb-4 shadow-gold">
            <Crown size={28} className="text-black" />
          </div>
          <h1 className="text-3xl font-black text-white">Join King Move</h1>
          <p className="text-gray-400 mt-1.5 text-sm">Start at 1200 ELO — climb the leagues</p>
        </div>

        {/* Card */}
        <div className="bg-bg-panel border border-white/5 rounded-2xl p-8 shadow-2xl">
          <SignupForm />
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-primary-chess hover:text-primary-hover font-semibold transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
