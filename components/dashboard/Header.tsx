"use client";

import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, BellOff, ChevronDown } from "lucide-react";

export type ActiveSection = "contacts" | "companies";


interface HeaderProps {
  title: "Contacts" | "Companies";
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('notificationsEnabled');
      return stored !== null ? JSON.parse(stored) : true;
    }
    return true;
  });

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('notificationsEnabled', JSON.stringify(notificationsEnabled));
    }
  }, [notificationsEnabled]);

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
          {/* Right side controls */}
          <div className="flex items-center gap-6">
            {/* Notification Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {notificationsEnabled ? (
                    <Bell className="h-4 w-4" />
                  ) : (
                    <BellOff className="h-4 w-4" />
                  )}
                  <span className="hidden lg:inline">
                    Notification: {notificationsEnabled ? "ON" : "OFF"}
                  </span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setNotificationsEnabled(true)}>
                  <Bell className="h-4 w-4 mr-2" />
                  Turn ON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setNotificationsEnabled(false)}>
                  <BellOff className="h-4 w-4 mr-2" />
                  Turn OFF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      {/* Mobile Header */}
      <header className="flex md:hidden h-16 items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex flex-1 items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className="h-8 w-8 p-0"
            >
              {notificationsEnabled ? (
                <Bell className="h-4 w-4" />
              ) : (
                <BellOff className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;