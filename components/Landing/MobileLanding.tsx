"use client"

import { MobileHeader } from "@/components/Landing/Mobile/MobileHeader";
import { HeroSectionMobile } from "@/components/Landing/Mobile/HeroSectionMobile";
import { FeatureLayoutSectionMobile } from "@/components/Landing/Mobile/FeatureLayoutSectionMobile";
import { TestimonialSectionMobile } from "@/components/Landing/Mobile/TestimonialSectionMobile";
import { CallToActionSectionMobile } from "@/components/Landing/Mobile/CallToActionSectionMobile";

interface MobileLandingProps {
  userEmail?: string | null;
}

export default function MobileLanding({ userEmail }: MobileLandingProps) {
  return (
    <>
      <MobileHeader userEmail={userEmail} />
      <main>
        <HeroSectionMobile />
        <FeatureLayoutSectionMobile />
        <TestimonialSectionMobile />
        <div id="call-to-action">
          <CallToActionSectionMobile />
        </div>
      </main>
    </>
  );
}