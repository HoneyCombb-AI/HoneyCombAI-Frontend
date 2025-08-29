'use client';

import { useSearchParams } from 'next/navigation';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthProvider } from "@/lib/auth-context";
import Header from "@/components/dashboard/Header";

export default function SupportLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    const searchParams = useSearchParams();
    const layoutType = searchParams.get('layout');

    // Dashboard layout (when coming from sidebar/dashboard pages)
    if (layoutType === 'dashboard') {
      return (
        <AuthProvider>
          <SidebarProvider>
            <AppSidebar />
            <div className='flex-1'>
              <Header title="Support" />
              <main className="flex-1 flex flex-col w-full">{children}</main>
            </div>
          </SidebarProvider>
        </AuthProvider>
      );
    }
    return (
      <main className="flex items-center justify-center min-h-screen p-4">
        {children}
      </main>
    );
  }
  