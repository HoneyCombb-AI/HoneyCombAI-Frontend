import { driver } from "driver.js";
import { DriveStep } from "driver.js";

export const companiesTourSteps: DriveStep[] = [
  {
    element: '[data-testid="group-dropdown"]',
    popover: {
      title: 'Group Companies',
      description: 'Organize companies by Industry, Location, or Employee Size to identify market segments and business opportunities.',
      side: "bottom",
      align: 'start'
    }
  },
  {
    element: '[data-testid="search-input"]',
    popover: {
      title: 'Search Companies',
      description: 'Find specific companies quickly by name, industry, or location to focus your outreach efforts.',
      side: "bottom",
      align: 'start'
    }
  },
  {
    element: '[data-testid="add-company-btn"]',
    popover: {
      title: 'Add Company',
      description: 'Manually add new companies to your database to expand your target market.',
      side: "bottom",
      align: 'start'
    }
  },
  {
    element: '[data-testid="enrichment-dropdown"]',
    popover: {
      title: 'Company Enrichment',
      description: 'Enhance company profiles with AI-powered enrichment including company details, news updates, and employee discovery.',
      side: "bottom",
      align: 'start'
    }
  },
  {
    element: '[data-testid="sample-company"]',
    popover: {
      title: 'Company Profile',
      description: 'Click on any company to view detailed information including contact count, industry insights, and enrichment data. This helps you understand your target companies better.',
      side: "left",
      align: 'start'
    }
  },
  {
    element: 'body',
    popover: {
      title: 'Next: Organizations',
      description: 'Excellent! Now let\'s move to the Organizations section to complete your tour and see how you can manage organizational relationships.',
      side: "bottom",
      align: 'center'
    }
  }
];

export const createCompaniesTour = (onComplete: () => void) => {
  const stepsWithCompletion = [...companiesTourSteps];
  const lastStep = stepsWithCompletion[stepsWithCompletion.length - 1];
  lastStep.popover = {
    ...lastStep.popover,
    onNextClick: onComplete
  };
  
  return driver({
    showProgress: true,
    steps: stepsWithCompletion,
    onDestroyed: () => {
      const url = new URL(window.location.href);
      url.searchParams.delete('joyride');
      window.history.replaceState({}, '', url.toString());
    }
  });
};