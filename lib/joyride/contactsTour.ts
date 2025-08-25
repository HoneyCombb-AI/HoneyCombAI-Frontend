import { driver } from "driver.js";
import { DriveStep } from "driver.js";

export const contactsTourSteps: DriveStep[] = [
  {
    element: '[data-testid="group-dropdown"]',
    popover: {
      title: 'Group By',
      description: 'Group your contacts by Company, Location, or Signals to better organize your data and identify patterns.',
      side: "bottom",
      align: 'end'
    }
  },
  {
    element: '[data-testid="search-input"]',
    popover: {
      title: 'Search Contacts',
      description: 'Quickly find specific contacts by name, company, or any other contact information.',
      side: "bottom",
      align: 'start'
    }
  },
  {
    element: '[data-testid="insert-dropdown"]',
    popover: {
      title: 'Insert Options',
      description: 'Add new contacts manually or import data from CSV files to expand your contact database.',
      side: "bottom",
      align: 'end'
    }
  },
  {
    element: '[data-testid="enrichment-dropdown"]',
    popover: {
      title: 'Enrichment Actions',
      description: 'Enhance your contact data with AI-powered enrichment analysis and manage contact tracking settings.',
      side: "over",
      align: 'center'
    }
  },
  {
    element: '[data-testid="sample-contact"]',
    popover: {
      title: 'Contact Profile',
      description: 'When this contact is clicked, a drawer will open displaying complete details including enrichment analysis if completed. This shows all the valuable insights you can gather about your contacts.',
      side: "bottom",
      align: 'start'
    }
  },
  {
    element: 'body',
    popover: {
      title: 'Next: Companies',
      description: 'Great! Now let\'s explore the Companies section to see how you can manage and analyze your company data.',
      side: "bottom",
      align: 'center'
    }
  }
];

export const createContactsTour = (onComplete: () => void) => {
  const stepsWithCompletion = [...contactsTourSteps];
  const lastStep = stepsWithCompletion[stepsWithCompletion.length - 1];
  lastStep.popover = {
    ...lastStep.popover,
    onNextClick: onComplete
  };
  
  return driver({
    showProgress: true,
    steps: stepsWithCompletion,
    popoverClass: 'driver-popover-custom',
    onDestroyed: () => {
      const url = new URL(window.location.href);
      url.searchParams.delete('joyride');
      window.history.replaceState({}, '', url.toString());
    }
  });
};