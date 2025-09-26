"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";


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
  const router = useRouter();
  const [showBookDemo, setShowBookDemo] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const heroSection = document.getElementById('hero-section');
      const finalCtaSection = document.getElementById('final-cta-section');
      const headerHeight = 80;

      let shouldShowButton = true;

      // Hide button if hero section is visible
      if (heroSection) {
        const heroBottom = heroSection.getBoundingClientRect().bottom;
        if (heroBottom > headerHeight) {
          shouldShowButton = false;
        }
      }

      // Hide button if final CTA section is visible
      if (finalCtaSection && shouldShowButton) {
        const finalCtaRect = finalCtaSection.getBoundingClientRect();
        const finalCtaTop = finalCtaRect.top;
        const finalCtaBottom = finalCtaRect.bottom;
        const windowHeight = window.innerHeight;
        const triggerDistance = 300;
        // Check if final CTA section is in viewport with buffer
        if (finalCtaTop < (windowHeight - triggerDistance) && finalCtaBottom > headerHeight) {
          shouldShowButton = false;
        }
      }

      setShowBookDemo(shouldShowButton);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleEnterAppClick = () => {
    router.push("/login");
  };

  const handleSupportClick = () => {
    router.push("/support");
  };
  return (
    <header className="fixed px-30 top-0 left-0 right-0 z-[1000] h-20 bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-100/90 backdrop-blur supports-[backdrop-filter]:bg-yellow-100/80">
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
        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="link"
            onClick={handleEnterAppClick}
            className="cursor-pointer text-nav text-black px-2 sm:px-4 py-2 hover:bg-white rounded-md text-sm sm:text-base"
          >
            Enter App
          </Button>
          <Button
            variant="link"
            onClick={handleSupportClick}
            className="cursor-pointer text-nav text-black px-2 sm:px-4 py-2 hover:bg-white rounded-md text-sm sm:text-base"
          >
           Support
          </Button>
          <AnimatePresence>
            {showBookDemo && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <Button
                  variant="outline"
                  className="hidden sm:flex cursor-pointer bg-black text-white hover:bg-black/90 hover:text-amber-300 rounded-lg text-base font-medium px-6 py-3 h-auto ml-2"
                  data-cal-namespace="30min"
                  data-cal-link="ankushnagathan/30min"
                  data-cal-config='{"layout":"month_view"}'
                >
                  Book demo
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Header;