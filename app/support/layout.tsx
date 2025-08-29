'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthProvider } from "@/lib/auth-context";
import Header from "@/components/dashboard/Header";
import { SimpleHeader } from "@/components/SimpleHeader";
import { Loading } from '@/components/loading';

function SupportLayoutContent({
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
        <>
            <SimpleHeader currentPage="support" />
            <main className="flex items-center justify-center min-h-screen p-4 pt-20 sm:pt-4 overflow-hidden" style={{ background: 'linear-gradient(135deg, hsla(46, 100%, 50%, 1) 0%, hsla(46, 100%, 50%, 1) 0%, hsla(0, 0%, 100%, 1) 57%)' }}>
                {children}
            </main>
        </>
    );
}

export default function SupportLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <Suspense fallback={
            <div className="flex-1 flex flex-col items-center justify-center min-h-screen">
                <Loading />
                <p className="text-sm text-muted-foreground mt-4">Loading Support...</p>
            </div>}>
            <SupportLayoutContent>{children}</SupportLayoutContent>
        </Suspense>
    );
}
