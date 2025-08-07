"use client";

import {
  Clock,
  Puzzle,
  Settings,
  ChevronRight,
  Bell,
  MessageSquare,
  LogOut,
  Users,
  Building2,
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
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/dist/client/link";
import { usePathname } from "next/navigation";

// Menu items
const items = [
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
  // {
  //   title: "AI Copilot",
  //   icon: Sparkles,
  //   url: "/",
  //   hasChevron: false,
  // },
  {
    title: "Analytics",
    icon: Clock,
    url: "/analytics",
    hasChevron: true,
  },
  // {
  //   title: "Automation",
  //   icon: Zap,
  //   url: "/automation",
  //   hasChevron: false,
  // },
  {
    title: "Integration",
    icon: Puzzle,
    url: "/integration",
    hasChevron: false,
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
  const pathname = usePathname();

  const isPathActive = (path: string) => {
    return pathname === path;
  };

  const handleSignOut = async () => {
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
    <Sidebar className="border-r">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-green-700 rounded-xl flex items-center justify-center shadow-sm overflow-hidden">
            <Image 
              src="/vercel.svg" 
              alt="Accountify Logo" 
              width={24} 
              height={32} 
              className="object-contain" 
              style={{ background: "transparent" }} 
            />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl text-foreground tracking-tight">
              Accountify
            </span>
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
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                    >
                      <Link href={item.url} className="flex items-center w-full">
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
              <SidebarMenuButton asChild>
                <a href="#" className="flex items-center w-full">
                  <Bell className="h-4 w-4" />
                  <span className="flex-1">Notification</span>
                  <Badge variant="secondary" className="ml-auto">
                    10
                  </Badge>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="#" className="flex items-center w-full">
                  <MessageSquare className="h-4 w-4" />
                  <span>Support</span>
                </a>
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
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium leading-none">
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