import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Header from "@/components/dashboard/Header";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <div className='flex-1 flex flex-col'>
                <Header title="Email Analytics" />
                <main className="flex-1 flex flex-col w-full h-full min-h-0 bg-gray-50/50">
                    {children}
                </main>
            </div>
        </SidebarProvider>
    );
}
