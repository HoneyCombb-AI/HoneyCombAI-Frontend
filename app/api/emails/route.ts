import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import axios from 'axios';

const MAIL_SERVER_URL = process.env.MAIL_SERVER_URL || 'https://mail.honeycombai.in';
const MAIL_SERVER_USER = process.env.MAIL_SERVER_USER || '';
const MAIL_SERVER_PASSWORD = process.env.MAIL_SERVER_PASSWORD || '';

export type EmailStatusFilter = "all" | "valid" | "invalid" | "risky" | "unknown";
export type EmailTemperatureFilter = "all" | "hot" | "warm" | "cold";

export interface ContactEmail {
    id: string;
    email: string | null;
    first_name: string;
    last_name: string;
    full_name: string;
    company_name: string;
    organization: string;
    temperature: string | null;
    verification_status: string;
    verification_data: {
        input: string;
        is_reachable: string;
        misc: {
            is_disposable: boolean;
            is_role_account: boolean;
            is_b2c: boolean;
            gravatar_url: string | null;
            haveibeenpwned: string | null;
        };
        mx: {
            accepts_mail: boolean;
            records: string[];
        };
        smtp: {
            can_connect_smtp?: boolean;
            has_full_inbox?: boolean;
            is_catch_all?: boolean;
            is_deliverable?: boolean;
            is_disabled?: boolean;
            error?: {
                type: string;
                message: string;
            };
            description?: string;
        };
        syntax: {
            address: string;
            domain: string;
            is_valid_syntax: boolean;
            username: string;
            normalized_email: string;
            suggestion: string | null;
        };
    } | null;
    status: string;
    unsubscribed: boolean;
    external_id: string;
}

export interface EmailsResponse {
    emails: ContactEmail[];
    total_count: number;
    organization: string;
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);

        // Get authenticated user to fetch their organization
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's organization from profiles or organizations table
        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id, organizations(name)')
            .eq('id', user.id)
            .single();

        const organizationName = (profile?.organizations as any)?.name;

        if (!organizationName) {
            return NextResponse.json(
                { error: 'Organization not found for user' },
                { status: 404 }
            );
        }

        // Get filter parameters
        const search = searchParams.get('search') || '';

        // Call remote mail server API
        const response = await axios.get(`${MAIL_SERVER_URL}/contacts`, {
            auth: {
                username: MAIL_SERVER_USER,
                password: MAIL_SERVER_PASSWORD,
            },
            params: {
                organization: organizationName,
            },
        });

        let emails: ContactEmail[] = response.data;

        // Filter out contacts without email and invalid contacts
        emails = emails.filter(email => {
            // Must have a non-null, non-empty email
            const hasEmail = email.email && email.email.trim() !== '';
            // Must not be invalid (case-insensitive check)
            const notInvalid = !email.verification_status || email.verification_status.toLowerCase() !== 'invalid';

            return hasEmail && notInvalid;
        });

        // Apply client-side search filter
        if (search) {
            const searchLower = search.toLowerCase();
            emails = emails.filter(email =>
                email.full_name?.toLowerCase().includes(searchLower) ||
                email.email?.toLowerCase().includes(searchLower) ||
                email.company_name?.toLowerCase().includes(searchLower)
            );
        }

        // Sort by name
        emails.sort((a, b) => a.full_name.localeCompare(b.full_name));

        const result: EmailsResponse = {
            emails,
            total_count: emails.length,
            organization: organizationName,
        };

        return NextResponse.json(result);

    } catch (error: unknown) {
        console.error('API /api/emails error:', error);

        if (axios.isAxiosError(error)) {
            return NextResponse.json(
                {
                    error: `Mail server error: ${error.response?.data?.message || error.message}`,
                    details: error.response?.data
                },
                { status: error.response?.status || 500 }
            );
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
