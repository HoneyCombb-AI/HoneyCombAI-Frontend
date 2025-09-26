"use client"

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import React, { JSX } from "react";

const HoneyCombIcon = ({ className }: { className?: string }) => (
  <div className={`relative ${className}`}>
    <div className="h-12 w-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl shadow-2xl shadow-amber-500/25 rotate-3 hover:rotate-0 transition-transform duration-700">
    </div>
    <div className="absolute -inset-2 rounded-2xl blur-lg opacity-30 animate-pulse"></div>
    <div className="absolute inset-0 flex items-end justify-end p-1 pointer-events-none">
      <svg className="w-6 h-6 mt-1 text-slate-900" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.5 3.5L22 12l-4.5 8.5h-11L2 12l4.5-8.5h11z" />
      </svg>
    </div>
  </div>
);

export function MobileHeader(): JSX.Element {
  const router = useRouter();

  const handleBookDemoClick = () => {
    const callToActionElement = document.querySelector('#call-to-action');
    if (callToActionElement) {
      callToActionElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      });
    }
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
              <span className="font-bold text-xl bg-gradient-to-r from-amber-600 to-yellow-500 bg-clip-text text-transparent tracking-tight">
                HoneyComb
              </span>
              <span className="text-sm font-medium text-black">
                AI
              </span>
            </div>
          </div>

          {/* RIGHT: Navigation buttons */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">

            {/* Support button - Visible on both mobile and desktop */}
            <Button
              variant="link"
              onClick={handleSupportClick}
              className="relative overflow-hidden group cursor-pointer bg-transparent hover:bg-transparent px-2 sm:px-3 py-2 h-auto text-xs sm:text-sm"
            >
              Support
              <div className="absolute w-full h-0.5 -bottom-1 -left-full bg-[#0f4f48] group-hover:left-0 transition-all duration-300" />
            </Button>

            {/* Book Demo button - Visible on both mobile and desktop */}
            <Button
              onClick={handleBookDemoClick}
              variant={"link"}
              className="bg-amber-600 cursor-pointer hover:bg-amber-500 text-white shadow-[0px_1px_2px_#1018280d] h-8 sm:h-11 px-2 sm:px-5 rounded [font-family:'Inter-Medium',Helvetica] font-medium text-xs sm:text-[14.9px] tracking-[0] leading-6"
            >
              Book Demo
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}