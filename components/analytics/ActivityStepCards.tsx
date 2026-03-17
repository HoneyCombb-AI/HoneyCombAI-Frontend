"use client";

import { Eye, MousePointerClick, ChevronDown, Users } from "lucide-react";
import { StepMetric } from "@/types/analytics";
import { Badge } from "@/components/ui/badge";

interface ActivityStepCardsProps {
    stepMetrics: StepMetric[];
    selectedStep: number | null;
    onStepClick: (step: number) => void;
}

function getStepBadgeColor(step: number) {
    const colors = [
        "bg-blue-100 text-blue-800",
        "bg-emerald-100 text-emerald-800",
        "bg-amber-100 text-amber-800",
        "bg-purple-100 text-purple-800",
        "bg-rose-100 text-rose-800",
    ];
    return colors[(step - 1) % colors.length];
}

export function ActivityStepCards({
    stepMetrics,
    selectedStep,
    onStepClick,
}: ActivityStepCardsProps) {
    const displayMetrics = stepMetrics.slice(0, 5);

    if (displayMetrics.length === 0) {
        return null;
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            {displayMetrics.map((metric) => (
                <button
                    key={metric.step}
                    onClick={() => onStepClick(metric.step)}
                    className={`
                        flex flex-col items-start gap-2.5 px-4 py-3 rounded-xl border transition-all hover:shadow-sm text-left w-full
                        ${selectedStep === metric.step
                            ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500 shadow-sm'
                            : 'bg-white border-gray-200 hover:border-gray-300'}
                    `}
                >
                    <div className="flex w-full items-center justify-between min-w-0">
                        <Badge className={`${getStepBadgeColor(metric.step)} truncate`} title={metric.step_label}>
                            {metric.step_label}
                        </Badge>
                        {selectedStep === metric.step && (
                            <ChevronDown className="w-4 h-4 text-gray-400 rotate-180 shrink-0" />
                        )}
                    </div>

                    <div className="flex items-center gap-3 w-full">
                        <div className="flex items-center gap-1.5 text-sm">
                            <Users className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                            <span className="font-medium text-gray-700">{metric.total_contacts}</span>
                        </div>
                        <div className="flex items-center gap-1 text-green-600 text-sm">
                            <Eye className="w-3.5 h-3.5 shrink-0" />
                            <span className="font-semibold">{metric.unique_opens}</span>
                        </div>
                        <div className="flex items-center gap-1 text-blue-600 text-sm">
                            <MousePointerClick className="w-3.5 h-3.5 shrink-0" />
                            <span className="font-semibold">{metric.unique_clicks}</span>
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
}
