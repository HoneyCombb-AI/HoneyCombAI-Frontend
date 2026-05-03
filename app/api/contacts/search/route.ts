import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface CompanyJoin {
    name: string | null;
}

interface ContactEmailJoin {
    email: string;
    is_primary: boolean;
}

interface ContactSearchRow {
    id: string;
    full_name: string;
    company: CompanyJoin | CompanyJoin[] | null;
    contact_emails?: ContactEmailJoin[] | null;
}

interface ContactEmailSearchRow {
    email: string;
    is_primary: boolean;
    contact: {
        id: string;
        full_name: string;
        company: CompanyJoin | CompanyJoin[] | null;
    } | {
        id: string;
        full_name: string;
        company: CompanyJoin | CompanyJoin[] | null;
    }[] | null;
}

const getCompanyName = (company: CompanyJoin | CompanyJoin[] | null) => {
    if (Array.isArray(company)) {
        return company[0]?.name || null;
    }

    return company?.name || null;
};

const getPrimaryEmail = (emails: ContactEmailJoin[] | null | undefined) => {
    if (!emails || emails.length === 0) {
        return null;
    }

    return emails.find((email) => email.is_primary)?.email || emails[0].email;
};

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const q = searchParams.get('q')?.trim() || '';
        const rawLimit = Number.parseInt(searchParams.get('limit') || '8', 10);
        const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 20) : 8;

        if (q.length < 2) {
            return NextResponse.json({ contacts: [] });
        }

        // Get user's organization
        const { data: membership, error: membershipError } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .maybeSingle();

        if (membershipError) {
            console.error('Failed to fetch org membership:', membershipError);
            return NextResponse.json(
                { error: 'Failed to fetch membership' },
                { status: 500 }
            );
        }

        if (!membership) {
            return NextResponse.json({ contacts: [] });
        }

        const [nameResult, emailResult] = await Promise.all([
            supabase
                .from('contacts')
                .select('id, full_name, company:companies(name), contact_emails(email, is_primary)')
                .ilike('full_name', `%${q}%`)
                .limit(limit),
            supabase
                .from('contact_emails')
                .select('email, is_primary, contact:contacts(id, full_name, company:companies(name))')
                .ilike('email', `%${q}%`)
                .order('is_primary', { ascending: false })
                .limit(limit),
        ]);

        if (nameResult.error || emailResult.error) {
            console.error('Contact search error:', nameResult.error ?? emailResult.error);
            return NextResponse.json({ contacts: [] });
        }

        const contactsById = new Map<string, {
            id: string;
            full_name: string;
            email: string | null;
            company_name: string | null;
        }>();

        (nameResult.data as ContactSearchRow[] | null || []).forEach((contact) => {
            contactsById.set(contact.id, {
                id: contact.id,
                full_name: contact.full_name,
                email: getPrimaryEmail(contact.contact_emails),
                company_name: getCompanyName(contact.company),
            });
        });

        (emailResult.data as ContactEmailSearchRow[] | null || []).forEach((row) => {
            const contact = Array.isArray(row.contact) ? row.contact[0] : row.contact;
            if (!contact) {
                return;
            }

            if (!contactsById.has(contact.id)) {
                contactsById.set(contact.id, {
                    id: contact.id,
                    full_name: contact.full_name,
                    email: row.email,
                    company_name: getCompanyName(contact.company),
                });
                return;
            }

            const existing = contactsById.get(contact.id);
            if (existing && (!existing.email || row.is_primary)) {
                contactsById.set(contact.id, {
                    ...existing,
                    email: row.email,
                });
            }
        });

        const contacts = Array.from(contactsById.values()).slice(0, limit);

        return NextResponse.json({ contacts });

    } catch (error) {
        console.error('Contact search error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
