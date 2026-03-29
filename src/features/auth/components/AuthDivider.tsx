export function AuthDivider() {
  return (
    <div className="relative my-5">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-white/10" />
      </div>
      <div className="relative flex justify-center text-xs">
        <span className="bg-bg-panel px-3 text-gray-500 font-semibold uppercase tracking-wider">or</span>
      </div>
    </div>
  )
}
