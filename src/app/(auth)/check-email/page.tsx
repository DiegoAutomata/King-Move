import Link from 'next/link'
import { Crown, Mail } from 'lucide-react'

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-chess text-white p-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-bg-panel border border-white/5 rounded-2xl p-10 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-primary-chess/10 border border-primary-chess/20 flex items-center justify-center mx-auto mb-6">
            <Mail size={28} className="text-primary-chess" />
          </div>
          <h1 className="text-2xl font-black text-white mb-3">Check your email</h1>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">
            We&apos;ve sent you a confirmation link. Click it to activate your account and start playing.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-primary-chess hover:text-primary-hover font-semibold text-sm transition-colors"
          >
            <Crown size={14} />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
