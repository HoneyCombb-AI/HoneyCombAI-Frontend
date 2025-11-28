"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface KPICardProps {
  title: string
  value: number | string
  description?: string
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  icon: React.ReactNode
  iconBgColor?: string
}

export function KPICard({
  title,
  value,
  description,
  trend = "neutral",
  trendValue,
  icon,
  iconBgColor = "bg-blue-500/10"
}: KPICardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 border border-muted bg-slate-50">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {title}
            </p>
            <div className="flex items-baseline gap-2 mb-2">
              <h3 className="text-3xl font-bold tracking-tight">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </h3>
              {trendValue && (
                <div className={cn(
                  "flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
                  trend === "up" && "text-green-600 bg-green-500/10",
                  trend === "down" && "text-red-600 bg-red-500/10",
                  trend === "neutral" && "text-yellow-600 bg-yellow-500/10"
                )}>
                  {trend === "up" && <TrendingUp className="w-3 h-3" />}
                  {trend === "down" && <TrendingDown className="w-3 h-3" />}
                  {trend === "neutral" && <Minus className="w-3 h-3" />}
                  {trendValue}
                </div>
              )}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className={cn("p-3 rounded-xl", iconBgColor)}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
