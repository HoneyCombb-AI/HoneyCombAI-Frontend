import { AppSidebar } from "@/components/app-sidebar";
import Header from "@/components/dashboard/Header";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function OverviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (

    <>
        <SidebarProvider>
          <AppSidebar />
          <div className='flex-1'>
            <Header title="Overview" />
            <main className="flex-1 flex flex-col w-full">{children}</main>
          </div>
        </SidebarProvider>
    </>

  );
}
