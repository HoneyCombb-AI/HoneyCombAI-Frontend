import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthProvider } from "@/lib/auth-context";
import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

export default function ABMLayout({ children }: { children: ReactNode }) {
    return (
        <AuthProvider>
            <SidebarProvider>
                <AppSidebar />
                <div className="flex-1 w-full">
                    <div className="sticky top-0 z-40 bg-white border-b shadow-sm">
                        {/* Desktop Header */}
                        <header className="hidden md:flex h-16 items-center gap-2 px-6">
                            <SidebarTrigger className="-ml-1" />
                            <div className="flex flex-1 items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-xl font-semibold text-gray-900">
                                        Growth Engine
                                    </h1>
                                    <Badge variant="outline" className="text-xs font-normal text-blue-600 border-blue-200">
                                        Beta
                                    </Badge>
                                </div>
                            </div>
                        </header>
                        {/* Mobile Header */}
                        <header className="flex md:hidden h-16 items-center gap-2 px-4">
                            <SidebarTrigger className="-ml-1" />
                            <div className="flex flex-1 items-center justify-between">
                                <h1 className="text-lg font-semibold text-gray-900">Companies</h1>
                            </div>
                        </header>
                    </div>
                    <main className="flex-1 flex flex-col w-full">{children}</main>
                </div>
            </SidebarProvider>
        </AuthProvider>
    )
}
