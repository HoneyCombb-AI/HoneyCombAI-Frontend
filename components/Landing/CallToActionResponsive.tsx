"use client";

import React from "react";
import { ResponsiveLayout } from "./ResponsiveLayout";
import { CallToActionSection } from "./Desktop/CallToActionSection";
import { CallToActionSectionMobile } from "./Mobile/CallToActionSectionMobile";

interface CallToActionResponsiveProps {
  userEmail?: string | null;
}
export function CallToActionResponsive({ userEmail }: CallToActionResponsiveProps) {
  const MobileComponent = () => <CallToActionSectionMobile />;
  const DesktopComponent = () => <CallToActionSection userEmail={userEmail} />;

  return (
    <ResponsiveLayout 
      mobileComponent={MobileComponent} 
      desktopComponent={DesktopComponent} 
    />
  );
}