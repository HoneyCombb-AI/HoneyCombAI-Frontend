"use client";

import React from "react";
import { ResponsiveLayout } from "./ResponsiveLayout";
import { CallToActionSection } from "./Desktop/CallToActionSection";
import { CallToActionSectionMobile } from "./Mobile/CallToActionSectionMobile";

interface CallToActionResponsiveProps {
  user?: any;
}

export function CallToActionResponsive({ user }: CallToActionResponsiveProps) {
  const MobileComponent = () => <CallToActionSectionMobile user={user} />;
  const DesktopComponent = () => <CallToActionSection user={user} />;

  return (
    <ResponsiveLayout 
      mobileComponent={MobileComponent} 
      desktopComponent={DesktopComponent} 
    />
  );
}