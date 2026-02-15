"use client";

import { useState } from "react";
import {
  Puzzle,
  Settings,
  ChevronRight,
  Bell,
  MessageSquare,
  LogOut,
  Users,
  Building2,
  Network,
  SendHorizontal,
  LayoutDashboard,
  Mail,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notification-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Link from "next/dist/client/link";
import { usePathname, useRouter } from "next/navigation";
import { NotificationPopoverContent } from "@/components/notification-popover";
import { toast } from "sonner";

// Menu items
const items = [
  {
    title: "Overview",
    icon: LayoutDashboard, // Using LayoutDashboard
    url: "/overview",
    hasChevron: false,
  },
  {
    title: "Contacts",
    icon: Users,
    url: "/contacts",
    hasChevron: false,
  },
  {
    title: "Companies",
    icon: Building2,
    url: "/companies",
    hasChevron: false,
  },
  {
    title: "Linkedin",
    icon: SendHorizontal,
    url: "/messages",
    hasChevron: false,
  },
  {
    title: "Emails",
    icon: Mail,
    url: "/emails",
    hasChevron: false,
  },
  {
    title: "Integration",
    icon: Puzzle,
    url: "/integration",
    hasChevron: false,
  },
  {
    title: "Organization",
    icon: Network,
    url: "/organization",
    hasChevron: true,
  },
  {
    title: "Settings",
    icon: Settings,
    url: "/profile",
    hasChevron: true,
  },
];

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const pathname = usePathname();
  const router = useRouter();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const isPathActive = (path: string) => {
    return pathname === path;
  };

  const handleSignOut = async () => {
    router.replace("/");
    signOut()
      .then(() => {
        toast.success("Signed out successfully");
      })
      .catch(() => {
        toast.error("Sign out failed");
      });
  };

  // Get user display name and email
  const displayName =
    user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
  const userEmail = user?.email || "";
  const avatarUrl = user?.user_metadata?.avatar_url;
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-16 w-16 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl shadow-2xl shadow-amber-500/25 rotate-3 hover:rotate-0 transition-transform duration-700">
            </div>
            <div className="absolute -inset-2 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-2xl blur-lg opacity-30 animate-pulse"></div>
            <div className="absolute inset-0 flex items-end justify-end p-1 pointer-events-none">
              <svg className="w-8 h-8 mt-1 text-slate-900" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.5 3.5L22 12l-4.5 8.5h-11L2 12l4.5-8.5h11z" />
              </svg>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl bg-gradient-to-r from-amber-600 to-yellow-500 bg-clip-text text-transparent tracking-tight hidden sm:block">
                HoneyComb
              </span>
              <span className="text-sm font-medium text-[#0f4f48] hidden sm:block">
                AI
              </span>
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              Business Intelligence
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = isPathActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link
                        href={item.url}
                        className="flex items-center w-full"
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="flex-1">{item.title}</span>
                        {item.hasChevron && (
                          <ChevronRight className="h-4 w-4 ml-auto opacity-50" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4 space-y-4">
        {/* Notification and Support */}
        <div className="space-y-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <Popover open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
                <PopoverTrigger asChild>
                  <SidebarMenuButton asChild>
                    <button className="flex items-center w-full relative">
                      <div className="relative">
                        <Bell className="h-4 w-4" />
                        {unreadCount > 0 && (
                          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium min-w-4">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </div>
                      <span className="flex-1 ml-2">Notification</span>
                    </button>
                  </SidebarMenuButton>
                </PopoverTrigger>
                <PopoverContent className="min-w-80" align="start">
                  <NotificationPopoverContent isOpen={isNotificationOpen} />
                </PopoverContent>
              </Popover>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/support?layout=dashboard" className="flex items-center w-full">
                  <MessageSquare className="h-4 w-4" />
                  <span>Support</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>

        {/* User Profile with Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start h-auto p-2 rounded-lg bg-muted/50 hover:bg-muted"
            >
              <div className="flex items-center gap-3 w-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="bg-white text-black">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium leading-none truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {userEmail}
                  </p>
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
