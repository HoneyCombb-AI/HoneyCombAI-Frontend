import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Header from "@/components/dashboard/Header";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <div className="flex-1 flex flex-col">
                <Header />
                <main className="flex-1 flex flex-col w-full">{children}</main>
            </div>
        </SidebarProvider>
    );
}
