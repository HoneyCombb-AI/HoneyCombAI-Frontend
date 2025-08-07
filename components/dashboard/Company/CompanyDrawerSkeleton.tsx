import * as React from "react"
import { cn } from "@/lib/utils"

// Base Skeleton component interface
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
}

// Main Skeleton component
function Skeleton({ className, ...props }: SkeletonProps) {
    return (
        <div
            className={cn("animate-pulse rounded-md bg-muted", className)}
            {...props}
        />
    )
}

// Complete Company Skeleton Props
interface CompleteCompanySkeletonProps {
    className?: string;
}

// Complete Company Skeleton - includes everything
function CompleteCompanySkeleton({ className }: CompleteCompanySkeletonProps) {
    return (
        <div className={cn("w-full mx-auto p-6 space-y-6", className)}>
            {/* Company Information Section */}
            <div className="space-y-4">
                <Skeleton className="h-4 w-[160px]" />
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                            <Skeleton className="h-4 w-4" />
                            <Skeleton className="h-3 w-[100px]" />
                        </div>
                        <div className="flex items-center space-x-3">
                            <Skeleton className="h-4 w-4" />
                            <Skeleton className="h-3 w-[60px]" />
                        </div>
                        <div className="flex items-center space-x-3">
                            <Skeleton className="h-4 w-4" />
                            <Skeleton className="h-3 w-[110px]" />
                        </div>
                        <div className="flex items-center space-x-3">
                            <Skeleton className="h-4 w-4" />
                            <Skeleton className="h-3 w-[140px]" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                            <Skeleton className="h-4 w-4" />
                            <Skeleton className="h-3 w-[120px]" />
                        </div>
                        <div className="flex items-center space-x-3">
                            <Skeleton className="h-4 w-4" />
                            <Skeleton className="h-3 w-[90px]" />
                        </div>
                        <div className="flex items-center space-x-3">
                            <Skeleton className="h-4 w-4" />
                            <Skeleton className="h-3 w-[130px]" />
                        </div>
                    </div>
                </div>

                {/* Links Section */}
                <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-3 w-[120px]" />
                    </div>
                    <div className="flex items-center space-x-3">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-3 w-[140px]" />
                    </div>
                </div>

                {/* Keywords Section */}
                <div className="space-y-3">
                    <Skeleton className="h-4 w-[80px]" />
                    <div className="flex flex-wrap gap-2">
                        <Skeleton className="h-6 w-[110px] rounded-full" />
                        <Skeleton className="h-6 w-[130px] rounded-full" />
                        <Skeleton className="h-6 w-[140px] rounded-full" />
                        <Skeleton className="h-6 w-[120px] rounded-full" />
                        <Skeleton className="h-6 w-[125px] rounded-full" />
                        <Skeleton className="h-6 w-[115px] rounded-full" />
                        <Skeleton className="h-6 w-[100px] rounded-full" />
                        <Skeleton className="h-6 w-[110px] rounded-full" />
                    </div>
                </div>
            </div>

            {/* Description Section */}
            <div className="space-y-3">
                <Skeleton className="h-4 w-[100px]" />
                <div className="space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-[98%]" />
                    <Skeleton className="h-3 w-[95%]" />
                    <Skeleton className="h-3 w-[92%]" />
                    <Skeleton className="h-3 w-[96%]" />
                    <Skeleton className="h-3 w-[94%]" />
                    <Skeleton className="h-3 w-[98%]" />
                    <Skeleton className="h-3 w-[90%]" />
                    <Skeleton className="h-3 w-[97%]" />
                    <Skeleton className="h-3 w-[85%]" />
                </div>
            </div>

            {/* Technology Stack Section */}
            <div className="space-y-4">
                <Skeleton className="h-4 w-[130px]" />
                <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-6 w-[40px] rounded-full" />
                    <Skeleton className="h-6 w-[100px] rounded-full" />
                    <Skeleton className="h-6 w-[70px] rounded-full" />
                    <Skeleton className="h-6 w-[50px] rounded-full" />
                    <Skeleton className="h-6 w-[130px] rounded-full" />
                    <Skeleton className="h-6 w-[110px] rounded-full" />
                    <Skeleton className="h-6 w-[90px] rounded-full" />
                    <Skeleton className="h-6 w-[80px] rounded-full" />
                    <Skeleton className="h-6 w-[100px] rounded-full" />
                    <Skeleton className="h-6 w-[95px] rounded-full" />
                    <Skeleton className="h-6 w-[75px] rounded-full" />
                    <Skeleton className="h-6 w-[85px] rounded-full" />
                    <Skeleton className="h-6 w-[90px] rounded-full" />
                    <Skeleton className="h-6 w-[85px] rounded-full" />
                    <Skeleton className="h-6 w-[120px] rounded-full" />
                    <Skeleton className="h-6 w-[80px] rounded-full" />
                    <Skeleton className="h-6 w-[70px] rounded-full" />
                    <Skeleton className="h-6 w-[80px] rounded-full" />
                    <Skeleton className="h-6 w-[90px] rounded-full" />
                    <Skeleton className="h-6 w-[85px] rounded-full" />
                </div>
            </div>

            {/* Recent News Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-[110px]" />
                    <Skeleton className="h-6 w-[90px] rounded-md" />
                </div>

                {/* News Items */}
                <div className="space-y-4">
                    {/* News Item 1 */}
                    <div className="flex items-start justify-between p-4 border border-muted rounded-lg">
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-[85%]" />
                            <div className="flex items-center space-x-4">
                                <Skeleton className="h-3 w-[80px]" />
                                <Skeleton className="h-3 w-[120px]" />
                            </div>
                        </div>
                        <Skeleton className="h-4 w-4 ml-4" />
                    </div>

                    {/* News Item 2 */}
                    <div className="flex items-start justify-between p-4 border border-muted rounded-lg">
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-[80%]" />
                            <div className="flex items-center space-x-4">
                                <Skeleton className="h-3 w-[80px]" />
                                <Skeleton className="h-3 w-[140px]" />
                            </div>
                        </div>
                        <Skeleton className="h-4 w-4 ml-4" />
                    </div>
                </div>
            </div>
        </div>
    )
}

// Export only the complete skeleton
export default CompleteCompanySkeleton
export { CompleteCompanySkeleton, type CompleteCompanySkeletonProps }