"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loading } from "@/components/loading";

export default function OnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const response = await fetch("/api/onboarding/clientContext");
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.is_onboarded) {
            router.replace("/contacts");
            return;
          }
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error checking onboarding status:", error);
        setIsLoading(false);
      }
    };
    checkOnboardingStatus();
  }, [router]);

  if (isLoading) {
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
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 relative z-10">
          <main className="flex-1 flex flex-col w-full">{children}</main>
        </div>
      </div>

    </>
  );
}
