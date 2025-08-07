'use client'
import React from 'react';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

const IntegrationPage: React.FC = () => {
  return (
    <main className="p-4">
      <SidebarTrigger />
      <h1 className="text-2xl font-bold mb-6">CRM Integrations</h1>
      
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert className="max-w-md">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-center">
            This integration feature is currently under development and will be available soon. Stay tuned for updates!
          </AlertDescription>
        </Alert>
      </div>
    </main>
  );
};

export default IntegrationPage;