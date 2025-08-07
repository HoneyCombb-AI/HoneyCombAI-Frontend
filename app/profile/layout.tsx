import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthProvider } from "@/lib/auth-context";


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
          <main className="flex-1 flex flex-col w-full">{children}</main>
        </SidebarProvider>
      </AuthProvider>
    </>
  );
}
