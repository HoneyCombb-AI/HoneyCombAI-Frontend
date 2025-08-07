import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthProvider } from "@/lib/auth-context";
import Header from "@/components/dashboard/Header";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <AuthProvider>
        <SidebarProvider>
          <AppSidebar />
          <div className='flex-1'>
            <Header title="Contacts" />
            <main className="flex-1 flex flex-col w-full">{children}</main>
          </div>
        </SidebarProvider>
      </AuthProvider>
    </>
  );
}
