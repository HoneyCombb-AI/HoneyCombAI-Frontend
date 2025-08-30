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
        if (response.data.success) {
          if (!response.data.has_organization) {
            router.replace("/organization");
            return;
          }
          if (response.data.is_onboarded) {
            router.replace("/contacts");
            return;
          }
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
      <main className="flex items-center justify-center min-h-screen p-4" style={{ background: 'linear-gradient(135deg, hsla(46, 100%, 50%, 1) 0%, hsla(46, 100%, 50%, 1) 0%, hsla(0, 0%, 100%, 1) 57%)' }}>{children}</main>
    </>
  );
}
