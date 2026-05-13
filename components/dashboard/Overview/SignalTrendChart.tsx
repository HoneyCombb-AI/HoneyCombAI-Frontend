"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface SignalTrend {
    date: string;
    custom: number;
    system: number;
}

interface SignalTrendChartProps {
    data: SignalTrend[];
}

export function SignalTrendChart({ data }: SignalTrendChartProps) {
    const hasData = data.some(item => item.custom > 0 || item.system > 0);

    return (
        <Card className="col-span-3 border-none bg-transparent shadow-none">
            <CardHeader className="pl-0 pb-2">
                <CardTitle>Intent Signal Activity</CardTitle>
            </CardHeader>
            <CardContent className="pl-0">
                <div className="h-[300px] w-full">
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
                                    <path d="M3 3v18h18" />
                                    <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
                                </svg>
                            </div>
                            <p className="text-sm font-medium">No signal activity yet</p>
                            <p className="text-xs opacity-70 mt-1">Activity will appear here once monitoring begins</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorCustom" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorSystem" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} strokeOpacity={0.1} />
                                <XAxis dataKey="date" hide />
                                <YAxis yAxisId="left" hide />
                                <YAxis yAxisId="right" hide />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', borderRadius: '8px' }}
                                    itemStyle={{ color: 'var(--foreground)' }}
                                    labelStyle={{ display: 'none' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="custom"
                                    name="Custom Signals"
                                    stroke="#8884d8"
                                    fillOpacity={1}
                                    fill="url(#colorCustom)"
                                    yAxisId="left"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="system"
                                    name="System Signals"
                                    stroke="#82ca9d"
                                    fillOpacity={1}
                                    fill="url(#colorSystem)"
                                    yAxisId="right"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
