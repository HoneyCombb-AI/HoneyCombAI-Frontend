import { NextResponse } from 'next/server';
import { sql } from '@/lib/postgres';

export interface ActivityCounts {
  posts?: number;
  comments?: number;
  reactions?: number;
  [key: string]: unknown;
}

export interface ActivityPercentages {
  posts?: number;
  comments?: number;
  reactions?: number;
  [key: string]: unknown;
}

export interface RecentActivityMix {
  counts?: ActivityCounts | null;
  percentages?: ActivityPercentages | null;
  [key: string]: unknown;
}

export interface PeakActivityDay {
  date?: string;
  predicted_events?: number;
  [key: string]: unknown;
}

export interface HistoricalDay {
  date?: string;
  events?: number;
  sample_urls?: string[];
  [key: string]: unknown;
}

export interface DailyForecastItem {
  date?: string;
  lower_bound?: number;
  upper_bound?: number;
  predicted_events?: number;
  [key: string]: unknown;
}

export interface ContactTrendForecast {
  contact_id: string;
  forecast_period_days: number | null;
  current_avg_daily_activity: number | null;
  forecasted_avg_daily_activity: number | null;
  trend_direction: string | null;
  trend_change_percent: number | null;
  recent_activity_mix: RecentActivityMix | null;
  peak_activity_days: PeakActivityDay[] | null;
  top_historical_days: HistoricalDay[] | null;
  daily_forecast: DailyForecastItem[] | null;
  model: string | null;
  forecasted_at: string | null;
}

export interface ContactTrendForecastResponse {
  trend_forecast: ContactTrendForecast | null;
}

type Params = { contactId?: string };

export async function GET(
  _req: Request,
  context: { params: Params }
): Promise<NextResponse<ContactTrendForecastResponse | { error: string }>> {
  const contactId = context.params.contactId;

  if (!contactId) {
    return NextResponse.json({ error: 'contactId is required' }, { status: 400 });
  }

  try {
    const { rows } = await sql<ContactTrendForecast>({
      text: `
        SELECT
          contact_id,
          forecast_period_days,
          current_avg_daily_activity,
          forecasted_avg_daily_activity,
          trend_direction,
          trend_change_percent,
          recent_activity_mix,
          peak_activity_days,
          top_historical_days,
          daily_forecast,
          model,
          forecasted_at::TEXT AS forecasted_at
        FROM contact_trend_forecasting
        WHERE contact_id = $1
        LIMIT 1
      `,
      values: [contactId],
    });

    const trend_forecast = rows[0] ?? null;

    return NextResponse.json<ContactTrendForecastResponse | { error: string }>({
      trend_forecast,
    });
  } catch (error) {
    console.error('Error fetching contact trend forecast:', error);
    return NextResponse.json<ContactTrendForecastResponse | { error: string }>(
      { error: 'Failed to fetch contact trend forecast' },
      { status: 500 }
    );
  }
}
