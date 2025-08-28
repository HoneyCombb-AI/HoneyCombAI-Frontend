"use client"

import { FeatureLayoutSection } from "@/components/Landing/Desktop/FeatureLayoutSection";
import { Header } from "@/components/Landing/Header";
import { HeroSection } from "@/components/Landing/Desktop/HeroSection";
import { TestimonialSection } from "@/components/Landing/Desktop/TestimonialSection";

import { HeroSectionMobile } from "@/components/Landing/Mobile/HeroSectionMobile";
import { FeatureLayoutSectionMobile } from "@/components/Landing/Mobile/FeatureLayoutSectionMobile";
import { TestimonialSectionMobile } from "@/components/Landing/Mobile/TestimonialSectionMobile";
import { CallToActionResponsive } from "@/components/Landing/CallToActionResponsive";

import { FooterSection } from "@/components/Landing/Desktop/FooterSection";
import { FooterSectionMobile } from "@/components/Landing/Mobile/FooterSectionMobile";

import { ResponsiveLayout } from "@/components/Landing/ResponsiveLayout";
import { Loading } from "@/components/loading";
import { useAuth } from "@/lib/auth-context";
import { JSX, useEffect, useState } from "react";

const HomePage = (): JSX.Element => {
  const { user, loading } = useAuth();
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side to prevent hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Show loading during SSR/hydration or auth initialization
  if (!isClient || loading) {
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
      <Header user={user} />
      <main className="flex flex-col w-full">
        <ResponsiveLayout 
          mobileComponent={HeroSectionMobile} 
          desktopComponent={HeroSection} 
        />
        <ResponsiveLayout 
          mobileComponent={FeatureLayoutSectionMobile} 
          desktopComponent={FeatureLayoutSection} 
        />
        <ResponsiveLayout 
          mobileComponent={TestimonialSectionMobile} 
          desktopComponent={TestimonialSection} 
        />
        <div id="call-to-action">
          <CallToActionResponsive user={user}/>
        </div>
        <ResponsiveLayout 
          mobileComponent={FooterSectionMobile} 
          desktopComponent={FooterSection} 
        />
      </main>
    </div>
  );
};

export default HomePage;
