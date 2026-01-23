import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const MAIL_SERVER_URL = process.env.MAIL_SERVER_URL || 'https://mail.honeycombai.in';
const MAIL_SERVER_USER = process.env.MAIL_SERVER_USER || '';
const MAIL_SERVER_PASSWORD = process.env.MAIL_SERVER_PASSWORD || '';

export interface ContactMessage {
    id: string;
    account_id: string;
    status: string;
    subject: string;
    thread_id: string;
    message_id: string;
    click_count: number;
    campaign_id: string;
    contact_id: string;
    sent_at: string;
    direction: string;
    body: string;
    open_count: number;
    replied_at: string | null;
}

export interface MessagesResponse {
    messages: ContactMessage[];
    contact_id: string;
}

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ contactId: string }> }
) {
    try {
        const { contactId } = await params;

        // Call remote mail server API to get messages for this contact
        const response = await axios.get(`${MAIL_SERVER_URL}/contacts/${contactId}/messages`, {
            auth: {
                username: MAIL_SERVER_USER,
                password: MAIL_SERVER_PASSWORD,
            },
        });

        const messages: ContactMessage[] = response.data;

        const result: MessagesResponse = {
            messages,
            contact_id: contactId,
        };

        return NextResponse.json(result);

    } catch (error: unknown) {
        console.error(`API /api/emails messages error:`, error);

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
