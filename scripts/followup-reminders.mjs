import { pathToFileURL } from "node:url";

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_PAGE_SIZE = 1000;
const DEFAULT_MAX_INSERTS = 100;
const DEFAULT_DEDUPE_WINDOW_DAYS = 2;
const DEFAULT_MAX_CONTACTS_PER_NOTIFICATION = 6;

const ENABLED_ORGANIZATION_IDS = [
  "3093979e-da9b-4a8e-89cb-b66014eb0e85",
  "77d3cea1-f25e-43d3-9733-2d82049d7fae",
  "0a34f10f-b819-4fda-bcf5-50cbfd87339a",
  "9ca802ba-abf4-4b93-abd0-64e92d910fc5"
];

function compactWhitespace(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parsePositiveInteger(value, fallback, name) {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  return ["1", "true", "yes", "y"].includes(String(value).toLowerCase());
}

function assertValidDate(value, name) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${name} must be a valid ISO date`);
  }
  return date;
}

function normalizeSupabaseUrl(value) {
  return value.replace(/\/+$/, "");
}

function chunk(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function makeGroupedBatchId({ reminderDays, dedupeWindowDays, organizationId, userId, now }) {
  const windowKey = getDedupeWindowKey(now, dedupeWindowDays);
  return `email_followup:${reminderDays}d:${dedupeWindowDays}d:${organizationId}:${userId}:${windowKey}`;
}

function resolveSenderUserId(emailLog, gmailAccountUsers, outlookAccountUsers) {
  if (emailLog.gmail_account_id) {
    return gmailAccountUsers.get(emailLog.gmail_account_id) || null;
  }
  if (emailLog.outlook_account_id) {
    return outlookAccountUsers.get(emailLog.outlook_account_id) || null;
  }
  return null;
}

function getContactDisplayName(contact) {
  return (
    compactWhitespace(contact?.full_name) ||
    compactWhitespace(contact?.first_name) ||
    "this contact"
  );
}

export function getDedupeWindowKey(now, dedupeWindowDays) {
  const dayNumber = Math.floor(now.getTime() / DAY_MS);
  const windowStartDayNumber = dayNumber - (dayNumber % dedupeWindowDays);
  return new Date(windowStartDayNumber * DAY_MS).toISOString().slice(0, 10);
}

function formatContactList(contacts) {
  const names = contacts.map(getContactDisplayName);
  if (names.length === 0) return "your contacts";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

export function buildGroupedFollowupNotification({
  userId,
  organizationId,
  contacts,
  reminderDays,
  dedupeWindowDays,
  now,
}) {
  const visibleContacts = contacts.slice(0, DEFAULT_MAX_CONTACTS_PER_NOTIFICATION);
  const contactList = formatContactList(visibleContacts);

  return {
    user_id: userId,
    type: "email_followup",
    batch_id: makeGroupedBatchId({ reminderDays, dedupeWindowDays, organizationId, userId, now }),
    text: `You need to follow up with ${contactList}.`,
    is_read: false,
  };
}

export function planFollowupNotifications({
  emailLogs,
  gmailAccounts,
  outlookAccounts,
  contacts,
  companies,
  enabledOrganizationIds,
  existingBatchIds,
  reminderDays,
  dedupeWindowDays,
  maxContactsPerNotification,
  now,
}) {
  const gmailAccountUsers = new Map(gmailAccounts.map((account) => [account.id, account.user_id]));
  const outlookAccountUsers = new Map(outlookAccounts.map((account) => [account.id, account.user_id]));
  const contactsById = new Map(contacts.map((contact) => [contact.id, contact]));
  const companiesById = new Map(companies.map((company) => [company.id, company]));
  const enabledOrgs = new Set(enabledOrganizationIds);
  const latestBySenderAndContact = new Map();

  if (enabledOrgs.size === 0) {
    return [];
  }

  for (const emailLog of emailLogs) {
    const senderUserId = resolveSenderUserId(emailLog, gmailAccountUsers, outlookAccountUsers);
    if (!senderUserId || !emailLog.contact_id || !emailLog.sent_at) continue;

    const key = `${senderUserId}:${emailLog.contact_id}`;
    const current = latestBySenderAndContact.get(key);
    if (!current || new Date(emailLog.sent_at) > new Date(current.emailLog.sent_at)) {
      latestBySenderAndContact.set(key, { senderUserId, emailLog });
    }
  }

  const dueAtCutoff = now.getTime() - reminderDays * DAY_MS;
  const dueBySenderAndOrg = new Map();

  for (const { senderUserId, emailLog } of latestBySenderAndContact.values()) {
    if (new Date(emailLog.sent_at).getTime() > dueAtCutoff) continue;

    const contact = contactsById.get(emailLog.contact_id);
    const organizationId = companiesById.get(contact?.company_id)?.organization_id || null;
    if (!organizationId || !enabledOrgs.has(organizationId)) continue;

    const key = `${senderUserId}:${organizationId}`;
    if (!dueBySenderAndOrg.has(key)) {
      dueBySenderAndOrg.set(key, {
        senderUserId,
        organizationId,
        items: [],
      });
    }

    dueBySenderAndOrg.get(key).items.push({
      contact,
      emailLog,
    });
  }

  const notifications = [];

  for (const group of dueBySenderAndOrg.values()) {
    const batchId = makeGroupedBatchId({
      reminderDays,
      dedupeWindowDays,
      organizationId: group.organizationId,
      userId: group.senderUserId,
      now,
    });

    if (existingBatchIds.has(batchId)) continue;

    const contactsForNotification = group.items
      .sort((a, b) => new Date(b.emailLog.sent_at) - new Date(a.emailLog.sent_at))
      .slice(0, maxContactsPerNotification)
      .map((item) => item.contact);

    notifications.push(
      buildGroupedFollowupNotification({
        userId: group.senderUserId,
        organizationId: group.organizationId,
        contacts: contactsForNotification,
        reminderDays,
        dedupeWindowDays,
        now,
      })
    );
  }

  return notifications;
}

async function supabaseFetch({ supabaseUrl, serviceRoleKey, table, query = {}, method = "GET", body, headers = {} }) {
  const url = new URL(`${supabaseUrl}/rest/v1/${table}`);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, {
    method,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    const responseBody = await response.text();
    throw new Error(`Supabase REST ${method} ${table} failed: ${response.status} ${responseBody}`);
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function fetchPaged({ supabaseUrl, serviceRoleKey, table, query, pageSize }) {
  const rows = [];
  for (let offset = 0; ; offset += pageSize) {
    const page = await supabaseFetch({
      supabaseUrl,
      serviceRoleKey,
      table,
      query: {
        ...query,
        limit: pageSize,
        offset,
      },
    });

    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return rows;
}

async function fetchRowsByIds({ supabaseUrl, serviceRoleKey, table, select, ids }) {
  const rows = [];
  for (const idChunk of chunk(unique(ids), 100)) {
    if (idChunk.length === 0) continue;
    const page = await supabaseFetch({
      supabaseUrl,
      serviceRoleKey,
      table,
      query: {
        select,
        id: `in.(${idChunk.join(",")})`,
      },
    });
    rows.push(...page);
  }
  return rows;
}

async function fetchExistingBatchIds({ supabaseUrl, serviceRoleKey, batchIds }) {
  const existing = new Set();
  for (const batchIdChunk of chunk(unique(batchIds), 100)) {
    if (batchIdChunk.length === 0) continue;
    const rows = await supabaseFetch({
      supabaseUrl,
      serviceRoleKey,
      table: "notifications",
      query: {
        select: "batch_id",
        batch_id: `in.(${batchIdChunk.join(",")})`,
      },
    });
    rows.forEach((row) => existing.add(row.batch_id));
  }
  return existing;
}

async function insertNotifications({ supabaseUrl, serviceRoleKey, notifications }) {
  if (notifications.length === 0) return;
  await supabaseFetch({
    supabaseUrl,
    serviceRoleKey,
    table: "notifications",
    method: "POST",
    body: notifications,
    headers: {
      Prefer: "return=minimal",
    },
  });
}

async function run() {
  const supabaseUrl = normalizeSupabaseUrl(requireEnv("SUPABASE_URL"));
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const reminderDays = parsePositiveInteger(
    process.env.FOLLOWUP_REMINDER_DAYS,
    4,
    "FOLLOWUP_REMINDER_DAYS"
  );
  const pageSize = parsePositiveInteger(process.env.FOLLOWUP_PAGE_SIZE, DEFAULT_PAGE_SIZE, "FOLLOWUP_PAGE_SIZE");
  const maxInserts = parsePositiveInteger(process.env.FOLLOWUP_MAX_INSERTS, DEFAULT_MAX_INSERTS, "FOLLOWUP_MAX_INSERTS");
  const dedupeWindowDays = parsePositiveInteger(
    process.env.FOLLOWUP_DEDUPE_WINDOW_DAYS,
    DEFAULT_DEDUPE_WINDOW_DAYS,
    "FOLLOWUP_DEDUPE_WINDOW_DAYS"
  );
  const maxContactsPerNotification = parsePositiveInteger(
    process.env.FOLLOWUP_MAX_CONTACTS_PER_NOTIFICATION,
    DEFAULT_MAX_CONTACTS_PER_NOTIFICATION,
    "FOLLOWUP_MAX_CONTACTS_PER_NOTIFICATION"
  );
  const dryRun = parseBoolean(process.env.FOLLOWUP_DRY_RUN, false);
  const now = process.env.FOLLOWUP_NOW ? assertValidDate(process.env.FOLLOWUP_NOW, "FOLLOWUP_NOW") : new Date();
  const startAt = process.env.FOLLOWUP_START_AT
    ? assertValidDate(process.env.FOLLOWUP_START_AT, "FOLLOWUP_START_AT").toISOString()
    : null;

  const emailLogQuery = {
    select: "id,contact_id,gmail_account_id,outlook_account_id,sent_at,subject",
    direction: "eq.outbound",
    status: "in.(sent,replied)",
    order: "sent_at.desc",
  };
  if (startAt) {
    emailLogQuery.sent_at = `gte.${startAt}`;
  }

  const [emailLogs, gmailAccounts, outlookAccounts] = await Promise.all([
    fetchPaged({
      supabaseUrl,
      serviceRoleKey,
      table: "email_logs",
      query: emailLogQuery,
      pageSize,
    }),
    fetchPaged({
      supabaseUrl,
      serviceRoleKey,
      table: "gmail_accounts",
      query: { select: "id,user_id" },
      pageSize,
    }),
    fetchPaged({
      supabaseUrl,
      serviceRoleKey,
      table: "outlook_accounts",
      query: { select: "id,user_id" },
      pageSize,
    }),
  ]);

  const contacts = await fetchRowsByIds({
    supabaseUrl,
    serviceRoleKey,
    table: "contacts",
    select: "id,company_id,full_name,first_name",
    ids: emailLogs.map((log) => log.contact_id),
  });

  const companies = await fetchRowsByIds({
    supabaseUrl,
    serviceRoleKey,
    table: "companies",
    select: "id,organization_id",
    ids: contacts.map((contact) => contact.company_id),
  });

  const candidateNotifications = planFollowupNotifications({
    emailLogs,
    gmailAccounts,
    outlookAccounts,
    contacts,
    companies,
    enabledOrganizationIds: ENABLED_ORGANIZATION_IDS,
    existingBatchIds: new Set(),
    reminderDays,
    dedupeWindowDays,
    maxContactsPerNotification,
    now,
  });

  const existingBatchIds = await fetchExistingBatchIds({
    supabaseUrl,
    serviceRoleKey,
    batchIds: candidateNotifications.map((notification) => notification.batch_id),
  });

  let notifications = planFollowupNotifications({
    emailLogs,
    gmailAccounts,
    outlookAccounts,
    contacts,
    companies,
    enabledOrganizationIds: ENABLED_ORGANIZATION_IDS,
    existingBatchIds,
    reminderDays,
    dedupeWindowDays,
    maxContactsPerNotification,
    now,
  });

  const uncappedNotificationCount = notifications.length;
  if (notifications.length > maxInserts) {
    notifications = notifications.slice(0, maxInserts);
  }

  console.log(
    JSON.stringify(
      {
        dryRun,
        reminderDays,
        dedupeWindowDays,
        maxContactsPerNotification,
        enabledOrganizations: ENABLED_ORGANIZATION_IDS.length,
        emailLogsScanned: emailLogs.length,
        senderAccountsScanned: gmailAccounts.length + outlookAccounts.length,
        contactsScanned: contacts.length,
        companiesScanned: companies.length,
        candidateNotifications: candidateNotifications.length,
        existingNotifications: existingBatchIds.size,
        pendingNotifications: uncappedNotificationCount,
        maxInserts,
        notificationsToInsert: notifications.length,
      },
      null,
      2
    )
  );

  if (dryRun) {
    console.log("Dry run enabled. No notifications inserted.");
    return;
  }

  await insertNotifications({ supabaseUrl, serviceRoleKey, notifications });
  console.log(`Inserted ${notifications.length} follow-up notifications.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
