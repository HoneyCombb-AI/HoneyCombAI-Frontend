"use client";

import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";

export type ActiveSection = "contacts" | "companies" | "support";


interface HeaderProps {
  title: "Contacts" | "Companies" | "Support" | "Organization" | "Messages";
}

const Header: React.FC<HeaderProps> = ({ title }) => {

  return (
    <div className="sticky top-0 z-40 bg-white border-b shadow-sm">
      {/* Desktop Header */}
      <header className="hidden md:flex h-16 items-center gap-2 px-6">
        <SidebarTrigger className="-ml-1" />
        <div className="flex flex-1 items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900">
              {title}
            </h1>
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