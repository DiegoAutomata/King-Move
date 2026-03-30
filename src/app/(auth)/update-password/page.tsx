import { Crown } from 'lucide-react'
import { UpdatePasswordForm } from '@/features/auth/components'

export default function UpdatePasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-chess text-white p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary-chess flex items-center justify-center mb-4 shadow-gold">
            <Crown size={28} className="text-black" />
          </div>
          <h1 className="text-3xl font-black text-white">New password</h1>
          <p className="text-gray-400 mt-1.5 text-sm">Choose a strong password for your account</p>
        </div>

        <div className="bg-bg-panel border border-white/5 rounded-2xl p-8 shadow-2xl">
          <UpdatePasswordForm />
        </div>
      </div>
    </div>
  )
}
