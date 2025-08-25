"use client";
import axios from 'axios';
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Loading } from "@/components/loading";
import { toast } from "sonner";
import {
  Building2,
} from "lucide-react";
import { OrganizationData } from '../api/organization/route';
import { CreateOrganizationDialog } from '@/components/organization/create-organization-dialog';
import { JoinOrganizationDialog } from '@/components/organization/join-organization-dialog';
import { OrganizationDetails } from '@/components/organization/organization-details';
import { useTour } from '@/lib/joyride/useTour';
import { useSearchParams } from 'next/navigation';


export default function OrganizationPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [organization, setOrganization] = useState<OrganizationData | null>(null);
  const searchParams = useSearchParams();
  const { isJoyrideMode } = useTour('organization', !loading && !authLoading);

  const fetchOrganizationData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await axios.get('/api/organization');

      if (response.data.organization) {
        setOrganization(response.data.organization);
      } else {
        setOrganization(null);
      }
    } catch (error) {
      console.error('Failed to fetch organization data:', error);
      toast.error('Failed to fetch organization data');
    } finally {
      setLoading(false);
    }
  };
  const fetchOrganizationDataWL = async () => {
    if (!user) return;

    try {
      const response = await axios.get('/api/organization');
      if (response.data.organization) {
        setOrganization(response.data.organization);
      } else {
        setOrganization(null);
      }
    } catch (error) {
      console.error('Failed to fetch organization data:', error);
      toast.error('Failed to fetch organization data');
    }
  };

  useEffect(() => {
    if (user && !authLoading) {
      fetchOrganizationData();
    }
  }, [authLoading]);



  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    )}

  return (
    <div className="flex min-h-screen w-full flex-col bg-gray-50/50">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white px-4" data-testid="organization-header">
        <SidebarTrigger className="-ml-1" />
        <div className="flex flex-1 items-center justify-between">
          <h1 className="text-xl font-semibold">Organization</h1>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6">
        {!organization ? (
          // No organization state
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                No Organization
              </h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                You&apos;re not part of any organization. Create a new one or join an existing organization using an invite code.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <div data-testid="create-organization-btn">
                  <CreateOrganizationDialog onOrganizationCreated={fetchOrganizationDataWL} />
                </div>
                <div data-testid="join-organization-btn">
                  <JoinOrganizationDialog onOrganizationJoined={fetchOrganizationDataWL} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div data-testid="organization-details">
            <OrganizationDetails
              organization={organization}
              onOrganizationUpdated={fetchOrganizationDataWL}
            />
          </div>
        )}
      </main>
    </div>
  );
}