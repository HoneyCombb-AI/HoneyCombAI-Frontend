import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Header from "@/components/dashboard/Header";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <div className="flex-1">
          <Header title="Messages" />
          <main className="flex-1 flex flex-col w-full">{children}</main>
        </div>
      </SidebarProvider>
    </>
  );
}