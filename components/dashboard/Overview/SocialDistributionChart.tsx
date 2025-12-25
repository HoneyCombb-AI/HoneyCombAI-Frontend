"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface DataPoint {
    name: string;
    value: number;
    [key: string]: any;
}

interface SocialDistributionChartProps {
    title: string;
    data: DataPoint[];
    type?: "bar" | "pie" | "donut" | "list";
    colors?: string[];
}

const DEFAULT_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

export function SocialDistributionChart({ title, data, type = "list", colors = DEFAULT_COLORS }: SocialDistributionChartProps) {
    const hasData = data && data.length > 0 && data.some(item => item.value > 0);

    const getIconForTrend = (name: string) => {
        const lower = name.toLowerCase().trim();
        if (lower === 'increasing' || lower.includes('up')) return <TrendingUp className="h-4 w-4 text-emerald-500" />;
        if (lower === 'decreasing' || lower.includes('down')) return <TrendingDown className="h-4 w-4 text-red-500" />;
        if (lower === 'flat' || lower === 'stable' || lower === 'neutral') return <Minus className="h-4 w-4 text-gray-400" />;
        return <Minus className="h-4 w-4 text-gray-400" />;
    };

    const getBadgeColor = (name: string) => {
        const lower = name.toLowerCase();
        if (lower === 'high' || lower === 'regular') return 'bg-emerald-500/10 text-emerald-600';
        if (lower === 'medium' || lower === 'sporadic') return 'bg-amber-500/10 text-amber-600';
        if (lower === 'low') return 'bg-gray-500/10 text-gray-600';
        return 'bg-secondary text-secondary-foreground';
    };

    const renderPieChart = () => (
        <div className="h-full w-full relative">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="40%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        cornerRadius={5}
                        dataKey="value"
                        stroke="none"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px' }}
                        itemStyle={{ color: 'var(--foreground)' }}
                    />
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center -translate-y-[10%]">
                <div className="text-center">
                    <div className="text-2xl font-bold">{data.reduce((acc, item) => acc + item.value, 0)}</div>
                    <div className="text-xs text-muted-foreground font-medium">Total</div>
                </div>
            </div>
            {/* Custom Legend below chart */}
            <div className="flex flex-wrap justify-center gap-2 mt-[-20px] px-2 relative z-10">
                {data.map((entry, index) => (
                    <div key={index} className="flex items-center gap-1.5 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full border border-border/50 text-xs">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                        <span className="text-muted-foreground font-medium">{entry.name}</span>
                        <span className="font-bold">{entry.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderList = () => (
        <div className="space-y-3 pt-2">
            {data.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border/50">
                    <div className="flex items-center gap-2">
                        {(title.includes("Trend")) && getIconForTrend(item.name)}
                        <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${!title.includes("Trend") ? getBadgeColor(item.name) : 'bg-muted text-muted-foreground'}`}>
                        {item.value}
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <Card className="col-span-1 border-none bg-transparent shadow-none h-full flex flex-col w-full">
            <CardHeader className="pl-0 pb-2">
                <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            </CardHeader>
            <CardContent className="pl-0">
                <div className={`h-[300px] w-full ${type === 'list' ? 'overflow-y-auto pr-2' : 'overflow-hidden'}`}>
                    {!hasData ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground bg-muted/5 rounded-lg border border-dashed border-border/50">
                            <div className="p-3 rounded-full bg-background/50 mb-3">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="opacity-50"
                                >
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 2a10 10 0 0 1 10 10" />
                                </svg>
                            </div>
                            <p className="text-xs font-medium">No data</p>
                        </div>
                    ) : (
                        (type === 'pie' || type === 'donut') ? renderPieChart() : renderList()
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
