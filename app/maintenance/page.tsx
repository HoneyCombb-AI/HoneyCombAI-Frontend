"use client";

import { AnimatedLogo } from "@/components/AnimatedLogo";

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-amber-900 flex flex-col p-6">
      <div className="flex-1 flex items-center justify-center w-full">
        <div className="flex flex-col items-start max-w-xl">
          
          <div className="flex flex-row items-center gap-6 mb-8">
            <AnimatedLogo width={80} height={74} className="opacity-90 animate-pulse shrink-0" />
            <h1 className="text-4xl md:text-5xl font-black bg-linear-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent tracking-tight">
              System upgrade
            </h1>
          </div>
          
          <p className="text-slate-300 mb-8 leading-relaxed text-lg">
            We're currently performing some scheduled maintenance to bring you an even better experience. Everything will be back up and running shortly.
          </p>
          
          <div className="bg-slate-800/50 rounded-xl p-5 border border-amber-900/50 backdrop-blur-sm w-full shadow-xl">
            <p className="text-sm font-medium text-amber-200/80">
              Thank you for your patience while we improve the platform.
            </p>
            <div className="mt-4 h-1 w-full bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-linear-to-r from-amber-600 to-yellow-400 rounded-full animate-pulse w-full"></div>
            </div>
          </div>
          
        </div>
      </div>
      
      <div className="w-full text-center mt-8">
        <p className="text-xs font-medium text-slate-500 tracking-wide pb-4">
          © {new Date().getFullYear()} Honeycomb AI
        </p>
      </div>
    </div>
  );
}
