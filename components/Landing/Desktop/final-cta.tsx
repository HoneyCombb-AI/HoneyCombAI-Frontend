"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { CalendarCheck, ShieldCheck, Ban, TrendingUp } from "lucide-react";

const FeatureCheckIcon = () =>
<div className="flex h-6 w-6 flex-shrink-0 items-center justify-center">
    <Image
    src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/2dd489b6-fdb0-4898-abbb-cc7b5e9464d3-getbirddog-ai/assets/svgs/68c6c8fedb31ef060a4d7aa1_52718cb75317ef8a94fa10bc31cb9fd1_icon-line-check-rounded-color-elements-brix-templates-4.svg?"
    alt="Checkmark icon"
    width={24}
    height={24} />

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
        asChild
        className="h-14 rounded-lg bg-black px-8 text-base font-semibold text-white transition-colors hover:bg-gray-800">

                <a
          href="https://cal.com/ankushhc/honeycomb-demo"
          target="_blank"
          rel="noopener noreferrer">

                  Book a demo
                </a>
            </Button>
        </div>);

};

const FinalCta = () => {
  return (
    <section className="bg-[#2C2C2C]">
      <div className="container py-24 md:py-32">
        <div className="rounded-2xl bg-white/5 p-8 sm:p-10 md:p-16 lg:px-20">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-20">
            <div className="flex flex-col justify-center text-white">
              <h2 className="text-[48px] font-bold leading-tight text-white">
                Don't wish you started sooner.
              </h2>
              <ul className="mb-12 mt-8 space-y-4">
                {featureList.map((feature, index) =>
                <li key={index} className="flex items-center gap-4">
                    <FeatureCheckIcon />
                    <span className="text-xl font-bold">{feature}</span>
                  </li>
                )}
              </ul>
              <CtaForm />
            </div>

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
    </section>);

};

export default FinalCta;