"use client";

import { Button } from "@/components/ui/button";
import { CalendarCheck, ShieldCheck, Ban, TrendingUp, CheckCircle } from "lucide-react";

const FeatureCheckIcon = () =>
  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center">
    <CheckCircle className="h-6 w-6 text-green-500" />
  </div>;


const featureList = [
  "15 Minute Setup",
  "Startups to Enterprises",
  "All the Insights to win deals."];

// Promotional badges to replace the image
const promoBadges = [
  { icon: CalendarCheck, label: "More meetings booked" },
  { icon: ShieldCheck, label: "100% accuracy with sources" },
  { icon: Ban, label: "No hallucinations" },
  { icon: TrendingUp, label: "More revenue pipeline" },
];


const CtaForm = () => {
  return (
    <div className="w-full">
         <Button
        variant="outline"
        className="cursor-pointer bg-white text-black transition-colors hover:bg-white hover:text-amber-400 rounded-lg text-base font-medium px-6 py-3 h-auto ml-2"
        data-cal-namespace="30min"
        data-cal-link="ankushnagathan/30min"
        data-cal-config='{"layout":"month_view"}'
      >
        Book demo
      </Button>
    </div>);

};

const FinalCta = () => {
  return (
    <section id="final-cta-section" className="bg-white">
      <div className="max-w-7xl mx-auto px-6 py-24 md:py-32">
        <div className="rounded-2xl bg-black p-8 sm:p-10 md:p-16">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-[1.2fr_1fr] lg:gap-20">

            {/* Left side */}
            <div className="flex flex-col justify-center text-white text-left">
              <h2 className="text-[48px] font-bold leading-tight">
                Don&apos;t wish you started sooner.
              </h2>
              <ul className="mb-12 mt-8 space-y-4">
                {featureList.map((feature, index) => (
                  <li key={index} className="flex items-center gap-4">
                    <FeatureCheckIcon />
                    <span className="text-xl font-bold">{feature}</span>
                  </li>
                ))}
              </ul>
              <CtaForm />
            </div>

            {/* Right side */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              {promoBadges.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-white shadow-sm"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold leading-snug">{label}</p>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCta;