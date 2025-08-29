"use client"

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import React, { JSX } from "react";
import { HoneyCombIcon } from "@/components/Landing/Header";

interface SimpleHeaderProps {
  currentPage: 'login' | 'support';
}



export function SimpleHeader({ currentPage }: SimpleHeaderProps): JSX.Element {
  const router = useRouter();

  const handleHomeClick = () => {
    router.push("/");
  };

  const handleSupportClick = () => {
    router.push("/support");
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b [border-bottom-style:solid] border-[#0f4f4880] w-full">
      <div className="relative w-full max-w-[1152px] h-[79px] mx-auto px-4 sm:px-6 lg:px-[136px]">
        <div className="flex items-center justify-between w-full h-full">
          {/* LEFT: Logo */}
          <div className="flex items-center gap-3">
            <HoneyCombIcon />
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl bg-gradient-to-r from-amber-600 to-yellow-500 bg-clip-text text-transparent tracking-tight hidden sm:block">
                HoneyComb
              </span>
              <span className="text-sm font-medium text-[#0f4f48] hidden sm:block">
                AI
              </span>
            </div>
          </div>

          {/* RIGHT: Navigation buttons */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
            {/* Home button - Always visible */}
            <Button
              variant="link"
              onClick={handleHomeClick}
              className="relative overflow-hidden group cursor-pointer bg-transparent hover:bg-transparent px-2 sm:px-3 py-2 h-auto text-xs sm:text-sm"
            >
              Home
              <div className="absolute w-full h-0.5 -bottom-1 -left-full bg-[#0f4f48] group-hover:left-0 transition-all duration-300" />
            </Button>

            {/* Conditional buttons based on current page */}
            {currentPage === 'login' && (
              <Button
                variant="link"
                onClick={handleSupportClick}
                className="relative overflow-hidden group cursor-pointer bg-transparent hover:bg-transparent px-2 sm:px-3 py-2 h-auto text-xs sm:text-sm"
              >
                Support
                <div className="absolute w-full h-0.5 -bottom-1 -left-full bg-[#0f4f48] group-hover:left-0 transition-all duration-300" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}