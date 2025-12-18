"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Loading } from "@/components/loading";
import { SimpleHeader } from "@/components/SimpleHeader";
import { useAuth } from "@/lib/auth-context";
import { AnimatedLogo } from "@/components/AnimatedLogo";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(true);
  const supabase = createClient();
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/contacts');
      } else {
        setIsRedirecting(false);
      }
    }
  }, [user, loading, router]);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback?next=/contacts`,
        },
      });

      if (error) throw error;
    } catch (err: unknown) {
      console.error("Error logging in:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setIsLoading(false);
    }
  };

  if (loading || isRedirecting) {
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

        <div className="bg-white flex items-center justify-center px-6">
          <div className="w-full max-w-md">
            <div>
              <h2 className="text-4xl font-black text-black mb-2">Welcome Back!</h2>
              <p className="text-sm font-medium text-gray-800 mb-6">Please enter login details below</p>

              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form
                onSubmit={(e) => e.preventDefault()}
                className="space-y-4"
                aria-label="Login form"
              >
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-sm">Enter your email</Label>
                  <Input id="email" type="email" placeholder="example@gmail.com" className="h-12" disabled />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password" className="text-sm">Enter your password</Label>
                  <Input id="password" type="password" placeholder="••••••••" className="h-12" disabled />
                  <div className="flex justify-end">
                    <a href="#" className="text-sm underline">Forgot password?</a>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    className="w-full h-12 rounded-md bg-gray-300 text-gray-500 text-sm font-medium cursor-not-allowed"
                    disabled
                  >
                    Email Login coming soon
                  </button>
                </div>

                <div>
                  <Button
                    variant="outline"
                    className="w-full h-12 flex items-center justify-center cursor-pointer bg-gray-50 text-black hover:bg-green-700 hover:text-white"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden>
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2" />
                        Signing in...
                      </div>
                    ) : (
                      <>
                        Continue with Google
                      </>
                    )}
                  </Button>
                </div>

              </form>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}