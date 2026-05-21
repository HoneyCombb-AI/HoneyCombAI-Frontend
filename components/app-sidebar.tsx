"use client";

import { useState, useEffect, useRef } from "react";
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
  Activity,
  ShieldCheck,
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
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NotificationPopoverContent } from "@/components/notification-popover";
import { toast } from "sonner";

// Menu items
const items = [
  {
    title: "Overview",
    icon: LayoutDashboard,
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
    title: "LinkedIn",
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
    title: "Email Analytics",
    icon: Activity,
    url: "/analytics/emails",
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
  const { user, signOut, role } = useAuth();
  const { unreadCount } = useNotifications();
  const pathname = usePathname();
  const { setOpen, state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Route-aware sidebar: expanded on /overview, collapsed everywhere else.
  // Uses a ref so the effect only re-runs when pathname changes,
  // not when ShadCN recreates the setOpen function reference.
  const setOpenRef = useRef(setOpen);
  setOpenRef.current = setOpen;

  useEffect(() => {
    setOpenRef.current(pathname === "/overview");
  }, [pathname]);

  const isPathActive = (path: string) => {
    return pathname === path;
  };

  const handleSignOut = async () => {
    toast.success("Signed out successfully");
    await signOut();
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
    <Sidebar
      collapsible="icon"
      className="border-r"
    >
      <SidebarHeader className="border-b p-3">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="relative shrink-0">
            <div className={`${isCollapsed ? 'h-8 w-8 rounded-lg' : 'h-10 w-10 rounded-xl'} bg-linear-to-br from-amber-400 to-yellow-500 shadow-lg shadow-amber-500/25 rotate-3 hover:rotate-0 transition-all duration-700`}>
            </div>
            <div className={`absolute ${isCollapsed ? '-inset-1' : '-inset-1.5'} bg-linear-to-r from-amber-400 to-yellow-500 rounded-xl blur-lg opacity-30 animate-pulse`}></div>
            <div className="absolute inset-0 flex items-end justify-end p-0.5 pointer-events-none">
              <svg className={`${isCollapsed ? 'w-4 h-4' : 'w-5 h-5'} mt-0.5 text-slate-900`} viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.5 3.5L22 12l-4.5 8.5h-11L2 12l4.5-8.5h11z" />
              </svg>
            </div>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg bg-linear-to-r from-amber-600 to-yellow-500 bg-clip-text text-transparent tracking-tight truncate">
                  HoneyComb
                </span>
                <span className="text-sm font-medium text-[#0f4f48]">
                  AI
                </span>
              </div>
              <span className="text-xs text-muted-foreground font-medium truncate">
                Business Intelligence
              </span>
            </div>
          )}
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
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
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

            {/* Admin-only items */}
            {role === 'admin' && (
              <SidebarMenu className="my-1">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isPathActive("/approvals")}
                    tooltip="Approvals"
                  >
                    <Link href="/approvals" className="flex items-center w-full">
                      <ShieldCheck className="h-4 w-4" />
                      <span className="flex-1">Approvals</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            )}

          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-2 space-y-1">
        {/* Notification and Support */}
        <SidebarMenu>
          <SidebarMenuItem>
            <Popover open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
              <PopoverTrigger asChild>
                <SidebarMenuButton tooltip="Notifications">
                  <div className="relative">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium min-w-4">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span>Notification</span>
                </SidebarMenuButton>
              </PopoverTrigger>
              <PopoverContent className="min-w-80 z-60" align="end" side="right" sideOffset={8}>
                <NotificationPopoverContent isOpen={isNotificationOpen} />
              </PopoverContent>
            </Popover>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Support">
              <Link href="/support">
                <MessageSquare className="h-4 w-4" />
                <span>Support</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* User Profile with Dropdown */}
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  tooltip={displayName}
                  className="bg-muted/50 hover:bg-muted"
                >
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarImage src={avatarUrl} alt={displayName} />
                    <AvatarFallback className="bg-white text-black text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium leading-none truncate">
                      {displayName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {userEmail}
                    </p>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="right" className="w-56">
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
