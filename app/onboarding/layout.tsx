"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loading } from "@/components/loading";
import { useAuth } from "@/lib/auth-context";
import axios from "axios";

export default function OnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (authLoading) return;
      
      if (!user) {
        router.replace("/login");
        return;
      }

      try {
        const response = await axios.get("/api/onboarding/clientContext");
        if (response.data.success && response.data.is_onboarded) {
          router.replace("/contacts");
          return;
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error checking onboarding status:", error);
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          router.replace("/login");
          return;
        }
        setIsLoading(false);
      }
    };
    checkOnboardingStatus();
  }, [router, user, authLoading]);

  if (isLoading || authLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen">
        <Loading />
        <p className="text-sm text-muted-foreground mt-4">Checking onboarding status...</p>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-slate-900 text-white overflow-hidden">
        <div className="flex min-h-svh w-full items-center justify-center">
          <main className="flex-1 flex flex-col w-full">{children}</main>
        </div>
      </div>

    </>
  );
}
