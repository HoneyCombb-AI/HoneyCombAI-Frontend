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
      description: 'Access two powerful enrichment options: Contact Tracking to monitor contact updates and changes, and Complete Contact Enrichment to perform comprehensive AI-powered analysis of contact profiles.',
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
    element: '[data-testid="sample-contact-signals"]',
    popover: {
      title: 'Intent Signals',
      description: 'These badges represent intent signals detected for this contact through AI analysis. They help identify potential opportunities, interests, and behavioral patterns to enhance your intelligence and outreach strategy.',
      side: "over",
      align: 'start'
    }
  },
  {
    element: '[data-testid="sample-contact-green-ring"]',
    popover: {
      title: 'Analysis Complete',
      description: 'The green ring around this contact\'s profile picture indicates that AI-powered enrichment analysis has been completed, providing you with valuable insights about this person.',
      side: "right",
      align: 'end'
    }
  },
  {
    element: '[data-testid="sample-contact-split-ring"]',
    popover: {
      title: 'Analysis Complete + Tracking',
      description: 'The split green and gold ring shows this contact has completed analysis AND is being actively tracked for updates and changes.',
      side: "right",
      align: 'start'
    }
  },
  {
    element: '[data-testid="sample-contact-loading-ring"]',
    popover: {
      title: 'Analysis In Progress',
      description: 'The animated quarter ring indicates that AI analysis is currently being processed for this contact. This typically takes a some time to complete.',
      side: "right",
      align: 'start'
    }
  },
  {
    element: 'body',
    popover: {
      title: 'Next: Companies',
      description: 'Great! Now you understand the different contact analysis states. Let\'s explore the Companies section to see how you can manage and analyze your company data.',
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