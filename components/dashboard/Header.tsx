"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";

const TITLE_MAP: Record<string, string> = {
  "/overview": "Overview",
  "/contacts": "Contacts",
  "/companies": "Companies",
  "/messages": "LinkedIn Messages",
  "/emails": "Emails",
  "/analytics/emails": "Email Analytics",
  "/integration": "Integration",
  "/organization": "Organization",
  "/profile": "Settings",
  "/support": "Support",
};

function resolveTitle(pathname: string): string {
  // Exact match first
  if (TITLE_MAP[pathname]) return TITLE_MAP[pathname];

  // Prefix match for nested routes (e.g. /contacts/123)
  const sortedKeys = Object.keys(TITLE_MAP).sort(
    (a, b) => b.length - a.length
  );
  for (const key of sortedKeys) {
    if (pathname.startsWith(key)) return TITLE_MAP[key];
  }

  return "Dashboard";
}

const Header: React.FC = () => {
  const pathname = usePathname();
  const title = resolveTitle(pathname);

  return (
    <div className="sticky top-0 z-40 bg-white border-b shadow-sm">
      {/* Desktop Header */}
      <header className="hidden md:flex h-16 items-center gap-2 px-6">
        <SidebarTrigger className="-ml-1" />
        <div className="flex flex-1 items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          </div>
        </div>
      </header>
      {/* Mobile Header */}
      <header className="flex md:hidden h-16 items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex flex-1 items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        </div>
      </header>
    </div>
  );
};

export default Header;