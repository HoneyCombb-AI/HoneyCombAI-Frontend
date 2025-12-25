import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    description?: string;
    className?: string;
    trend?: "up" | "down" | "neutral";
}

export function StatCard({ title, value, icon: Icon, description, className, trend }: StatCardProps) {
    // Determine if value is a number or a string that looks like a number percentage
    const isNumber = typeof value === 'number';
    const numValue = isNumber ? value as number : 0;

    // Check for percentage string like "85%"
    const isPercentage = typeof value === 'string' && value.endsWith('%');
    const percentageValue = isPercentage ? parseInt(value as string) : 0;

    return (
        <Card className={cn("overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm hover:bg-accent/5 transition-colors", className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {isNumber ? (
                        <AnimatedCounter value={numValue} />
                    ) : isPercentage ? (
                        <AnimatedCounter value={percentageValue} suffix="%" />
                    ) : (
                        value
                    )}
                </div>
                {description && (
                    <p className="text-xs text-muted-foreground mt-1">
                        {description}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
