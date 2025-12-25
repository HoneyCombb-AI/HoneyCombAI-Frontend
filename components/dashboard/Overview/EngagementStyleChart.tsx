"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";

interface EngagementStyle {
    name: string;
    value: number;
}

interface EngagementStyleChartProps {
    data: EngagementStyle[];
}

export function EngagementStyleChart({ data }: EngagementStyleChartProps) {
    const [animated, setAnimated] = useState(false);
    const hasData = data && data.length > 0 && data.some(item => item.value > 0);
    const totalValue = hasData ? data.reduce((sum, item) => sum + item.value, 0) : 0;

    useEffect(() => {
        const timer = setTimeout(() => setAnimated(true), 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <Card className="col-span-2 border-none bg-transparent shadow-none">
            <CardHeader className="pl-0 pb-2">
                <CardTitle className="font-semibold">Engagement Styles</CardTitle>
            </CardHeader>
            <CardContent className="pl-0">
                <div className="h-[300px] w-full overflow-y-auto pr-2">
                    {!hasData ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground bg-muted/5 rounded-lg border border-dashed border-border/50">
                            <div className="p-3 rounded-full bg-background/50 mb-3">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="opacity-50"
                                >
                                    <path d="M12 20V10" />
                                    <path d="M18 20V4" />
                                    <path d="M6 20v-4" />
                                </svg>
                            </div>
                            <p className="text-sm font-medium">No engagement data</p>
                            <p className="text-xs opacity-70 mt-1">Styles will appear as contacts interact</p>
                        </div>
                    ) : (
                        <div className="space-y-4 pt-2">
                            {data.map((item, index) => {
                                const percentage = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
                                return (
                                    <div key={index} className="space-y-1">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">{item.name}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{item.value}</span>
                                                <span className="text-xs text-muted-foreground">({percentage.toFixed(0)}%)</span>
                                            </div>
                                        </div>
                                        <Progress
                                            value={animated ? percentage : 0}
                                            className="h-2 transition-all duration-1000 ease-out"
                                            indicatorClassName="bg-primary/80 transition-all duration-1000 ease-out"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
