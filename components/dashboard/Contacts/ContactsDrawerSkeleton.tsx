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

// Complete Profile Skeleton Props
interface CompleteProfileSkeletonProps {
  className?: string;
}

// Complete Profile Skeleton - includes everything
function CompleteProfileSkeleton({ className }: CompleteProfileSkeletonProps) {
  return (
    <div className={cn("w-full mx-auto p-6 space-y-6", className)}>

      {/* Social Intents Section */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-[120px]" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-[140px] rounded-full" />
          <Skeleton className="h-6 w-[120px] rounded-full" />
          <Skeleton className="h-6 w-[160px] rounded-full" />
          <Skeleton className="h-6 w-[110px] rounded-full" />
        </div>
      </div>

      {/* Personal Information Section */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-[140px]" />
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-3 w-[120px]" />
          </div>
          <div className="flex items-center space-x-3">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-3 w-[80px]" />
          </div>
          <div className="flex items-center space-x-3">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-3 w-[100px]" />
          </div>
          <div className="flex items-center space-x-3">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-3 w-[90px]" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-3 w-[100px]" />
          </div>
          <div className="flex items-center space-x-3">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-3 w-[120px]" />
          </div>
          <div className="flex items-center space-x-3">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-3 w-[110px]" />
          </div>
          <div className="flex items-center space-x-3">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-3 w-[130px]" />
          </div>
        </div>
      </div>

      {/* Social Nudges Section */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-[110px]" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-[90%]" />
          <Skeleton className="h-3 w-[85%]" />
          <Skeleton className="h-3 w-[95%]" />
        </div>
      </div>

      {/* Social Activity Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-[120px]" />
          <Skeleton className="h-6 w-[80px] rounded-full" />
        </div>
        
        {/* Activity Stats */}
        <div className="flex space-x-8">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-[80px] rounded" />
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-[80px] rounded" />
          </div>
        </div>

        {/* Time and Posts Stats */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Skeleton className="h-3 w-[140px]" />
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-3 w-[80px]" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-[120px]" />
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-3 w-[60px]" />
            </div>
          </div>
        </div>

        {/* Optimal Time */}
        <div className="p-4 bg-muted/50 rounded-lg space-y-2">
          <Skeleton className="h-3 w-[160px]" />
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-3 w-[80px]" />
            </div>
            <Skeleton className="h-3 w-[100px]" />
          </div>
        </div>

        {/* Footer */}
        <div className="text-right">
          <Skeleton className="h-3 w-[120px] ml-auto" />
        </div>
      </div>

      {/* Social Intelligence Section */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-[140px]" />
      </div>

      {/* Primary Data Analysis Section */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-[160px]" />
      </div>
    </div>
  )
}

// Export only the complete skeleton
export default CompleteProfileSkeleton