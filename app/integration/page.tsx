'use client'
import React from 'react';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

const IntegrationPage: React.FC = () => {
  return (
    <div className="flex min-h-screen w-full flex-col bg-gray-50/50">
      <header className="hidden md:flex h-16 items-center gap-2 px-6">
        <SidebarTrigger className="-ml-1" />
        <div className="flex flex-1 items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900">
              Integration
            </h1>
          </div>
        </div>
      </header>

      <div className="flex items-center justify-center min-h-[400px]">
        <Alert className="max-w-md">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-center">
            This integration feature is currently under development and will be available soon. Stay tuned for updates!
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default IntegrationPage;