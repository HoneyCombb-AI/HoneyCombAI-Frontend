import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createContactsTour } from './contactsTour';
import { createCompaniesTour } from './companiesTour';
import { createOrganizationTour } from './organizationTour';

export const useTour = (currentPage: 'contacts' | 'companies' | 'organization', isDataLoaded?: boolean) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const joyride = searchParams.get("joyride");
  const isJoyrideMode = joyride === "true";

  const navigateToNextPage = (nextPage: string) => {
    router.push(`/${nextPage}?joyride=true`);
  };

  const finishTour = () => {
    // Navigate back to contacts without joyride parameter
    router.push('/contacts');
  };

  useEffect(() => {
    if (!isJoyrideMode) return;

    // Small delay to ensure DOM elements are rendered
    const timer = setTimeout(() => {
      switch (currentPage) {
        case 'contacts':
          const contactsTour = createContactsTour(() => {
            navigateToNextPage('companies');
          });
          contactsTour.drive();
          break;

        case 'companies':
          const companiesTour = createCompaniesTour(() => {
            navigateToNextPage('organization');
          });
          companiesTour.drive();
          break;

        case 'organization':
          const organizationTour = createOrganizationTour(() => {
            finishTour();
          });
          organizationTour.drive();
          break;
      }
    }, 500); // 500ms delay to ensure components are mounted

    return () => clearTimeout(timer);
  }, [isJoyrideMode, currentPage]);

  return {
    isJoyrideMode,
    startTour: () => {
      router.push('/contacts?joyride=true');
    }
  };
};