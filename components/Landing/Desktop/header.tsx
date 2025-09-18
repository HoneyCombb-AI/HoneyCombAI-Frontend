"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const platformLinks: { title: string; href: string; description: string }[] = [
  {
    title: "Overview",
    href: "/platform",
    description: "See more about what the platform can do.",
  },
  {
    title: "Use Cases",
    href: "/uses",
    description: "See how teams use Honeycomb to win.",
  },
  {
    title: "FAQ",
    href: "/faq",
    description: "Answers to common questions prospects have about Honeycomb.",
  },
];

const resourcesLinks: { title: string; href: string; description: string }[] = [
  {
    title: "Setup and Tutorials",
    href: "#",
    description: "Get up and running on new features and techniques.",
  },
  {
    title: "Integrations",
    href: "/integrations",
    description: "See how Honeycomb connects into your systems.",
  },
];

const companyLinks: { title: string; href: string; description: string }[] = [
  {
    title: "Our Story",
    href: "/about",
    description: "Two founders competing against the largest companies in the world.",
  },
  {
    title: "Press",
    href: "/press",
    description: "Logos, Descriptions, Press resources.",
  },
  {
    title: "Careers",
    href: "/careers",
    description: "We're always looking for talented people. Join our team!",
  },
];

export const HoneyCombIcon = ({ className }: { className?: string }) => (
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

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed px-30 top-0 left-0 right-0 z-[1000] h-20 bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-100/90 backdrop-blur supports-[backdrop-filter]:bg-yellow-100/80 border-b border-black/5">
      <div className="container mx-auto flex h-full items-center justify-between">
      <Link href="/" className="inline-block">
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
      </Link>
        <div className="hidden lg:flex items-center gap-2 ml-auto">
          <Link href="/dashboard" className="text-nav text-black px-4 py-2 hover:bg-black/5 rounded-md">Dashboard</Link>
          <Link href="/support" className="text-nav text-black px-4 py-2 hover:bg-black/5 rounded-md">Support</Link>
          <Button asChild className="bg-black text-white hover:bg-black/90 rounded-lg text-base font-medium px-6 py-3 h-auto ml-2">
            <a href="https://www.honeycombai.in/" target="_blank" rel="noopener noreferrer">Book a Demo</a>
          </Button>
        </div>
        <div className="lg:hidden">
          <Button onClick={() => setIsMenuOpen(!isMenuOpen)} variant="ghost" size="icon" className="text-black">
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>
      {isMenuOpen && (
        <div className="lg:hidden absolute top-20 left-0 w-full bg-white/90 backdrop-blur shadow-lg border-t border-black/10">
          <div className="container mx-auto flex flex-col items-center space-y-2 p-8">
            <Link href="/" className="text-nav text-black py-2 text-lg w-full text-center hover:bg-black/5 rounded-md" onClick={() => setIsMenuOpen(false)}>Home</Link>
            <div className="pt-4 flex flex-col items-center space-y-4 w-full">
              <Button asChild className="w-full bg-black text-white hover:bg-black/90 rounded-lg text-lg font-medium">
                <a href="https://www.honeycombai.in/" target="_blank" rel="noopener noreferrer">Book a Demo</a>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;