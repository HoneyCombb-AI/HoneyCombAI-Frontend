import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const MAIL_SERVER_URL = process.env.MAIL_SERVER_URL || 'https://mail.honeycombai.in';
const MAIL_SERVER_USER = process.env.MAIL_SERVER_USER || '';
const MAIL_SERVER_PASSWORD = process.env.MAIL_SERVER_PASSWORD || '';

export interface DraftResponse {
    subject: string;
    body: string;
}

export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ contactId: string }> }
) {
    try {
        const { contactId } = await params;

        // Call remote mail server API to generate draft
        const response = await axios.post(
            `${MAIL_SERVER_URL}/emails/contact/${contactId}/generate-draft`,
            {},
            {
                auth: {
                    username: MAIL_SERVER_USER,
                    password: MAIL_SERVER_PASSWORD,
                },
            }
        );

        const draft: DraftResponse = response.data;

        return NextResponse.json(draft);

    } catch (error: unknown) {
        console.error(`API generate-draft error:`, error);

        if (axios.isAxiosError(error)) {
            // Even on error, the API returns a draft with error message
            if (error.response?.data) {
                return NextResponse.json(error.response.data);
            }

            return NextResponse.json(
                {
                    subject: 'Error',
                    body: `<p>Error generating draft: ${error.message}</p>`,
                },
                { status: error.response?.status || 500 }
            );
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return NextResponse.json(
            {
                subject: 'Error',
                body: `<p>Error generating draft: ${errorMessage}</p>`,
            },
            { status: 500 }
        );
    }
}
