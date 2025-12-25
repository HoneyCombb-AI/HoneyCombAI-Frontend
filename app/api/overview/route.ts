import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";


export interface DashboardData {
    stats: {
        totalContacts: number;
        hotOpportunities: number;
        warmOpportunities: number;
        totalSignals: number;
        sociallyActive: number;
        analysisMetrics: {
            completed: number;
            pending: number;
        };
    };
    trends: {
        date: string;
        custom: number;
        system: number;
    }[];
    influence: {
        name: string;
        value: number;
    }[];
    socialMetrics: {
        momentum: number;
        engagement_style: {
            name: string;
            value: number;
        }[];
        activity_level: {
            name: string;
            value: number;
        }[];
        consistency: {
            name: string;
            value: number;
        }[];
        trend_direction: {
            name: string;
            value: number;
        }[];
    };
}

export async function GET() {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("get_dashboard_overview");

    if (error) {
        console.error("Error fetching dashboard overview:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}
