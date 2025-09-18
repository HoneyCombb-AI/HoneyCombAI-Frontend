"use client"

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import React, { JSX } from "react";
import Link from "next/link";
import { HoneyCombIcon } from "./Landing/Desktop/header";

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
    <Button
      variant="link"
      onClick={handleHomeClick}
      className="cursor-pointer text-black px-2 sm:px-4 py-2 hover:bg-amber-200 rounded-md text-sm sm:text-base"
    >
      Home
    </Button>
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