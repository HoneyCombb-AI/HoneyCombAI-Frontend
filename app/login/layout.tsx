"use client"

import { Loading } from "@/components/loading";
import { SimpleHeader } from "@/components/SimpleHeader";
import { useAuth } from "@/lib/auth-context";
import { AnimatedLogo } from "@/components/AnimatedLogo";
import { redirect } from "next/navigation";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900 flex items-center justify-center">
        <div className="text-center">
          <Loading />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent mb-2">
            Honeycomb AI
          </h1>
          <p className="text-slate-400 animate-pulse">Gathering your experience...</p>
        </div>
      </div>
    )
  }
  if (user) {
    redirect('/contacts');
  }
  return (
    <>
      <SimpleHeader currentPage="login" />
      <main className="h-[calc(100vh-80px)] grid grid-cols-1 md:grid-cols-2">
        <div className="hidden md:flex flex-col justify-between bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-100/90">
          <div className="w-full flex-1 flex flex-col justify-center items-center px-16">
            <div className="max-w-2xl ml-12">
              <AnimatedLogo
                width={102}
                height={96}
                className="mb-6"
              />
              <h1 className="text-5xl font-black text-black leading-tight mb-6">
                Hello
                <br />
                <span className="text-black">Honeycomb</span>
              </h1>
              <p className="text-xl font-semibold text-gray-800">
                Win Your Next Big Opportunity with
                <br />
                Honeycomb&apos;s Real-Time Pipeline Signals &
                <br />
                Smart Prospect Research
              </p>
            </div>
          </div>
          <div className="flex justify-between items-center text-xs mt-6 px-4 py-4">
            <div className="font-semibold text-black">© 2025 Honeycomb AI</div>
            <div className="space-x-4">
              <a href="#" className="font-medium text-gray-700 underline">Terms of Service</a>
              <a href="#" className="font-medium text-gray-700 underline">Privacy Policy</a>
            </div>
          </div>
        </div>

        {/* RIGHT: white background with the actual form (children from page.tsx) */}
        <div className="bg-white flex items-center justify-center px-6">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>
      </main>
    </>
  );
}
