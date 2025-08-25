import { driver } from "driver.js";
import { DriveStep } from "driver.js";

export const organizationTourSteps: DriveStep[] = [
  {
    element: '[data-testid="organization-header"]',
    popover: {
      title: 'Organization Management',
      description: 'This is your organization hub where you can manage team settings, view member information, and control organizational preferences.',
      side: "bottom",
      align: 'start'
    }
  },
  {
    element: '[data-testid="user-role-card"]',
    popover: {
      title: 'Your Role',
      description: 'This shows your role in the organization. As an Owner, you have full administrative privileges. As a Member, you can access shared resources and contribute to the organization.',
      side: "bottom",
      align: 'start'
    }
  },
  {
    element: '[data-testid="token-balance-card"]',
    popover: {
      title: 'Token Balance',
      description: 'View the organization\'s total token balance available for AI enrichment tasks. This is shared across all organization members.',
      side: "over",
      align: 'center'
    }
  },
  {
    element: '[data-testid="organization-members-card"]',
    popover: {
      title: 'Organization Members',
      description: 'See all organization members, their token usage, personal limits, and roles. Owners can manage member permissions and token allocations.',
      side: "top",
      align: 'start'
    }
  },
  {
    element: 'body',
    popover: {
      title: 'Tour Complete!',
      description: 'You\'ve successfully completed the HoneyComb AI tour! You now know how to manage contacts, companies, and organizations. Start building your network and leveraging AI-powered insights.',
      side: "bottom",
      align: 'center'
    }
  }
];

export const createOrganizationTour = (onComplete: () => void) => {
  const stepsWithCompletion = [...organizationTourSteps];
  const lastStep = stepsWithCompletion[stepsWithCompletion.length - 1];
  lastStep.popover = {
    ...lastStep.popover,
    onNextClick: () => {
      const driverInstance = (window as any).__driver_js_instance;
      if (driverInstance) {
        driverInstance.destroy();
      }
      onComplete();
    }
  };
  
  const driverInstance = driver({
    showProgress: true,
    steps: stepsWithCompletion,
    popoverClass: 'driver-popover-custom',
    onDestroyed: () => {
      const url = new URL(window.location.href);
      url.searchParams.delete('joyride');
      window.history.replaceState({}, '', url.toString());
    }
  });
  
  (window as any).__driver_js_instance = driverInstance;
  return driverInstance;
};