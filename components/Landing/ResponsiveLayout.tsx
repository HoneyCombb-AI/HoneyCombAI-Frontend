"use client";

import React from "react";

interface ResponsiveLayoutProps {
  mobileComponent: React.ComponentType;
  desktopComponent: React.ComponentType;
}

export function ResponsiveLayout({ mobileComponent: MobileComponent, desktopComponent: DesktopComponent }: ResponsiveLayoutProps) {
  return (
    <>
      <div className="block md:hidden">
        <MobileComponent />
      </div>
      <div className="hidden md:block">
        <DesktopComponent />
      </div>
    </>
  );
}