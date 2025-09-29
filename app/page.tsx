"use client"

import DesktopLanding from "@/components/Landing/DesktopLanding";
import MobileLanding from "@/components/Landing/MobileLanding";
import { Loading } from "@/components/loading";
import { JSX, useEffect, useState } from "react";

const HomePage = (): JSX.Element => {
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side to prevent hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Show loading during SSR/hydration or auth initialization
  if (!isClient) {
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
    );
  }

  return (
    <div className="bg-white w-full min-h-screen">
      {/* Desktop - hidden on mobile */}
      <div className="hidden md:block">
        <DesktopLanding />
      </div>

      {/* Mobile - hidden on desktop */}
      <div className="block md:hidden">
        <MobileLanding />
      </div>
    </div>
  );
};

export default HomePage;