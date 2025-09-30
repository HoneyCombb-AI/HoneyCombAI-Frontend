"use client"

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import React, { JSX } from "react";
import Link from "next/link";

interface SimpleHeaderProps {
  currentPage: 'login' | 'support';
}

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


export function SimpleHeader({ currentPage }: SimpleHeaderProps): JSX.Element {
  const router = useRouter();

  const handleHomeClick = () => {
    router.push("/");
  };

  const handleSupportClick = () => {
    router.push("/support");
  };

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="h-20 grid grid-cols-1 md:grid-cols-2">
        {/* Left side - matches the golden gradient */}
   {/* Left side */}
<div className="hidden md:flex bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-100/90 items-center px-[120px]">
  <Link href="/" className="inline-block">
    <div className="flex items-center gap-3">
      <HoneyCombIcon />
      <div className="flex items-center gap-2">
        <span className="font-bold text-xl bg-gradient-to-r from-amber-600 to-yellow-500 bg-clip-text text-transparent tracking-tight">
          HoneyComb
        </span>
        <span className="text-sm font-medium text-black">AI</span>
      </div>
    </div>
  </Link>
</div>

{/* Right side */}
<div className="bg-white flex items-center justify-between px-3 md:px-[120px] md:justify-end">
  {/* Mobile logo */}
  <Link href="/" className="inline-block md:hidden">
    <div className="flex items-center gap-3">
      <HoneyCombIcon />
      <div className="flex items-center gap-2">
        <span className="font-bold text-xl bg-gradient-to-r from-amber-600 to-yellow-500 bg-clip-text text-transparent tracking-tight">
          HoneyComb
        </span>
        <span className="text-sm font-medium text-black">AI</span>
      </div>
    </div>
  </Link>

  <div className="flex items-center gap-2">
    {currentPage === "support" && (
      <Button
        variant="link"
        onClick={handleHomeClick}
        className="cursor-pointer text-black px-2 sm:px-4 py-2 hover:bg-amber-200 rounded-md text-sm sm:text-base"
      >
        Home
      </Button>
    )}
    {currentPage === "login" && (
      <Button
        variant="link"
        onClick={handleSupportClick}
        className="cursor-pointer text-black px-2 sm:px-4 py-2 hover:bg-amber-200 rounded-md text-sm sm:text-base"
      >
        Support
      </Button>
    )}
  </div>
</div>

      </div>
    </header>
  );
}