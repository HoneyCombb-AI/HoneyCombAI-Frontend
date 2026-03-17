import { StepMetric, StepContact } from "@/types/analytics";
import { ActivityStepCards } from "./ActivityStepCards";
import { ActivityFeedDetails } from "./ActivityFeedDetails";

interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

interface ActivityFeedProps {
    stepMetrics: StepMetric[];
    selectedStep: number | null;
    stepContacts: StepContact[];
    loadingContacts: boolean;
    contactPagination: PaginationInfo | null;
    expandedContact: string | null;
    onStepClick: (step: number) => void;
    onExpandedChange: (contactId: string | null) => void;
}

export function ActivityFeed({
    stepMetrics,
    selectedStep,
    stepContacts,
    loadingContacts,
    contactPagination,
    expandedContact,
    onStepClick,
    onExpandedChange,
}: ActivityFeedProps) {

    if (stepMetrics.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <p className="text-lg font-medium">No tracking data yet</p>
            </div>
        );
    }

    return (
        <div className="w-full pb-2">
            {/* Step Metric Cards Section (Max 5 grid) */}
            <ActivityStepCards
                stepMetrics={stepMetrics}
                selectedStep={selectedStep}
                onStepClick={onStepClick}
            />

            {/* Detailed Contacts Accordion Section */}
            <ActivityFeedDetails
                stepMetrics={stepMetrics}
                selectedStep={selectedStep}
                stepContacts={stepContacts}
                loadingContacts={loadingContacts}
                contactPagination={contactPagination}
                expandedContact={expandedContact}
                onExpandedChange={onExpandedChange}
            />
        </div>
    );
}

