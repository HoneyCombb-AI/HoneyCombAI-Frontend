"use client"

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import React, { JSX } from "react";

interface HeaderProps {
  user?: any;
}

const HexagonIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.5 3.5L22 12l-4.5 8.5h-11L2 12l4.5-8.5h11z" />
  </svg>
);

export function Header({ user }: HeaderProps): JSX.Element {
  const router = useRouter();

  const handleLoginClick = () => {
    console.log("click")
    if (user) {
      router.push("/contacts");
    } else {
      router.push("/login");
    }
  };

  const handleBookDemoClick = () => {
    router.push("/onboarding");
  };

  return (
    <header className="bg-white border-b [border-bottom-style:solid] border-[#0f4f4880] w-full">
      <div className="relative w-full max-w-[1152px] h-[79px] mx-auto px-4 sm:px-6 lg:px-[136px]">
        <div className="flex items-center justify-between w-full h-full">
          {/* LEFT: Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <HexagonIcon className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500" />
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-yellow-500 opacity-20 rounded blur-sm"></div>
            </div>
            <span className="font-bold text-lg sm:text-xl text-[#0f4f48]">HoneyComb</span>
            <span className="text-xs sm:text-sm">AI</span>
          </div>
          
          {/* Background decorative elements */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-amber-500/10 to-yellow-500/5 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-1/2 -left-20 w-80 h-80 bg-gradient-to-br from-orange-500/10 to-amber-500/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
            <div className="absolute bottom-0 right-1/3 w-72 h-72 bg-gradient-to-br from-yellow-500/10 to-amber-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
          </div>

          {/* RIGHT: Log in + Book demo */}
          <div className="flex items-center gap-2 sm:gap-4 lg:gap-[67px]">
            <Button
              variant="ghost"
              onClick={handleLoginClick}
              className="relative overflow-hidden group cursor-pointer hidden sm:block bg-transparent hover:bg-transparent px-2 sm:px-3 py-2 h-auto text-sm"
            >
               {user ? "Dashboard" : "Log in"}
              <div className="absolute w-full h-0.5 -bottom-1 -left-full bg-[#0f4f48] group-hover:left-0 transition-all duration-300" />
            </Button>

            <Button 
              onClick={handleBookDemoClick}
              className="bg-[#4adf7d] hover:bg-[#4adf7d]/90 text-[#0f4f48] shadow-[0px_1px_2px_#1018280d] h-9 sm:h-11 px-3 sm:px-5 rounded [font-family:'Inter-Medium',Helvetica] font-medium text-xs sm:text-[14.9px] tracking-[0] leading-6"
            >
              {user ? "Dashboard" : "Book demo"}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
