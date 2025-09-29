import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <header id="hero-section" className="bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-100/90">
      <div className="mx-auto max-w-[1400px] px-6">
        <div className="py-32 sm:py-40 lg:py-44">
          <div
            className="grid grid-cols-1 items-center
            gap-y-16 lg:grid-cols-2 lg:gap-x-8"
          >
            {/* Left Content */}
            <div className="text-center lg:text-left">
              {/* Headline */}
              <h1 className="text-5xl font-extrabold tracking-tight text-black sm:text-6xl lg:text-[72px] lg:leading-[1.1]">
                Start selling to customers who already want to buy
              </h1>

              {/* Subtitle */}
              <p className="mt-6 text-xl leading-8 text-neutral-900 !whitespace-pre-line">
                Honeycomb monitors news, social media, job postings, and company
                research, then routes verified signals so your reps act first
                with full context.
              </p>

              {/* CTAs */}
              <div className="mt-10 flex flex-col items-stretch gap-4 sm:flex-row sm:justify-center lg:justify-start">
                <Button
                  variant="outline"
                  className="cursor-pointer bg-black text-white hover:bg-black/90 hover:text-amber-300 rounded-lg text-base font-medium px-6 py-3 h-auto ml-2"
                  data-cal-namespace="30min"
                  data-cal-link="shahzad-mir/30min"
                  data-cal-config='{"layout":"month_view"}'
                >
                  Book demo
                </Button>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative">
              <div
                className="rounded-xl border
           border-black/10 bg-white/60 shadow-[0_8px_24px_rgba(0,0,0,0.08)] p-3 w-full"
              >
                <Image
                  src="/Dashboard.png"
                  alt="Dashboard: Signals, Social Intelligence, Custom Signals"
                  width={800}
                  height={600}
                  className="w-full h-auto object-contain rounded-lg border border-black/20"
                  priority
                />
              </div>
              <p className="mt-2 text-center font-semibold text-xs text-black">
                &ldquo;Unique to our Sales requirements&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeroSection;
