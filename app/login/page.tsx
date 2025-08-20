import { LoginForm } from "@/components/login-form"

// Custom Hexagon SVG Component
const HexagonIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.5 3.5L22 12l-4.5 8.5h-11L2 12l4.5-8.5h11z" />
  </svg>
);

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-900 text-white overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-amber-500/10 to-yellow-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-20 w-80 h-80 bg-gradient-to-br from-orange-500/10 to-amber-500/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 right-1/3 w-72 h-72 bg-gradient-to-br from-yellow-500/10 to-amber-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>

        {/* Hexagonal Grid Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="grid grid-cols-12 gap-4 h-full w-full transform rotate-12 scale-150">
            {Array.from({ length: 144 }).map((_, i) => (
              <HexagonIcon
                key={i}
                className="w-4 h-4 text-amber-400 animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Login Form */}
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 relative z-10">
        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
