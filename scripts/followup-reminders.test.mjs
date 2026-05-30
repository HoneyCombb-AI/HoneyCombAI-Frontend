import assert from "node:assert/strict";
import test from "node:test";

import {
  buildGroupedFollowupNotification,
  getDedupeWindowKey,
  planFollowupNotifications,
  quotePostgrestInValue,
} from "./followup-reminders.mjs";

const now = new Date("2026-05-30T00:00:00.000Z");

test("buildGroupedFollowupNotification includes contact names and deterministic org/user/window batch id", () => {
  const notification = buildGroupedFollowupNotification({
    userId: "user-1",
    organizationId: "org-1",
    contacts: [
      { id: "contact-1", full_name: "Sarah Khan", first_name: "Sarah" },
      { id: "contact-2", full_name: "Ajay Mehta", first_name: "Ajay" },
      { id: "contact-3", full_name: null, first_name: "Shahzad" },
    ],
    reminderDays: 4,
    dedupeWindowDays: 2,
    maxContactsPerNotification: 6,
    now,
  });

  assert.equal(notification.user_id, "user-1");
  assert.equal(notification.type, "email_followup");
  assert.equal(notification.batch_id, "email_followup:4d:2d:org-1:user-1:2026-05-29");
  assert.equal(notification.is_read, false);
  assert.equal(
    notification.text,
    "You need to follow up with Sarah Khan, Ajay Mehta, and Shahzad."
  );
});

test("buildGroupedFollowupNotification honors configured contact cap above the default", () => {
  const contacts = [
    "Ava",
    "Ben",
    "Cara",
    "Dev",
    "Eli",
    "Faye",
    "Gus",
    "Hana",
  ].map((name, index) => ({
    id: `contact-${index}`,
    full_name: name,
    first_name: name,
  }));

  const notification = buildGroupedFollowupNotification({
    userId: "user-1",
    organizationId: "org-1",
    contacts,
    reminderDays: 4,
    dedupeWindowDays: 2,
    maxContactsPerNotification: 8,
    now,
  });

  assert.equal(
    notification.text,
    "You need to follow up with Ava, Ben, Cara, Dev, Eli, Faye, Gus, and Hana."
  );
});

test("getDedupeWindowKey changes every two days", () => {
  assert.equal(getDedupeWindowKey(new Date("2026-05-30T00:00:00.000Z"), 2), "2026-05-29");
  assert.equal(getDedupeWindowKey(new Date("2026-05-31T00:00:00.000Z"), 2), "2026-05-31");
});

test("quotePostgrestInValue quotes reserved characters for in filters", () => {
  assert.equal(
    quotePostgrestInValue('email_followup:4d:2d:org:user:2026-05-29'),
    '"email_followup:4d:2d:org:user:2026-05-29"'
  );
  assert.equal(quotePostgrestInValue('a"b\\c'), '"a\\"b\\\\c"');
});

test("planFollowupNotifications filters by enabled orgs and groups top contacts per sender and org", () => {
  const planned = planFollowupNotifications({
    emailLogs: [
      {
        id: "due-log-1",
        contact_id: "contact-1",
        gmail_account_id: "gmail-1",
        outlook_account_id: null,
        sent_at: "2026-05-20T12:00:00.000Z",
        subject: "Email 1",
      },
      {
        id: "due-log-2",
        contact_id: "contact-2",
        gmail_account_id: "gmail-1",
        outlook_account_id: null,
        sent_at: "2026-05-21T12:00:00.000Z",
        subject: "Email 2",
      },
      {
        id: "due-log-disabled-org",
        contact_id: "contact-3",
        gmail_account_id: "gmail-1",
        outlook_account_id: null,
        sent_at: "2026-05-21T12:00:00.000Z",
        subject: "Email 3",
      },
    ],
    gmailAccounts: [{ id: "gmail-1", user_id: "user-1" }],
    outlookAccounts: [],
    contacts: [
      { id: "contact-1", company_id: "company-1", full_name: "Sarah Khan", first_name: "Sarah" },
      { id: "contact-2", company_id: "company-1", full_name: "Ajay Mehta", first_name: "Ajay" },
      { id: "contact-3", company_id: "company-2", full_name: "Ignored Person", first_name: "Ignored" },
    ],
    companies: [
      { id: "company-1", organization_id: "org-1" },
      { id: "company-2", organization_id: "org-2" },
    ],
    enabledOrganizationIds: ["org-1"],
    existingBatchIds: new Set(),
    reminderDays: 4,
    dedupeWindowDays: 2,
    maxContactsPerNotification: 6,
    now,
  });

  assert.equal(planned.length, 1);
  assert.equal(planned[0].user_id, "user-1");
  assert.equal(planned[0].batch_id, "email_followup:4d:2d:org-1:user-1:2026-05-29");
  assert.equal(planned[0].text, "You need to follow up with Ajay Mehta and Sarah Khan.");
});

test("planFollowupNotifications only considers latest email per sender and contact", () => {
  const planned = planFollowupNotifications({
    emailLogs: [
      {
        id: "old-due-log",
        contact_id: "contact-1",
        gmail_account_id: "gmail-1",
        outlook_account_id: null,
        sent_at: "2026-05-20T12:00:00.000Z",
        subject: "Old email",
      },
      {
        id: "new-not-due-log",
        contact_id: "contact-1",
        gmail_account_id: "gmail-1",
        outlook_account_id: null,
        sent_at: "2026-05-29T12:00:00.000Z",
        subject: "New email",
      },
    ],
    gmailAccounts: [{ id: "gmail-1", user_id: "user-1" }],
    outlookAccounts: [],
    contacts: [{ id: "contact-1", company_id: "company-1", full_name: "Sarah Khan", first_name: "Sarah" }],
    companies: [{ id: "company-1", organization_id: "org-1" }],
    enabledOrganizationIds: ["org-1"],
    existingBatchIds: new Set(),
    reminderDays: 4,
    dedupeWindowDays: 2,
    maxContactsPerNotification: 6,
    now,
  });

  assert.deepEqual(planned, []);
});

test("planFollowupNotifications skips grouped reminders already present in notifications", () => {
  const planned = planFollowupNotifications({
    emailLogs: [
      {
        id: "due-log",
        contact_id: "contact-1",
        gmail_account_id: null,
        outlook_account_id: "outlook-1",
        sent_at: "2026-05-20T12:00:00.000Z",
        subject: null,
      },
    ],
    gmailAccounts: [],
    outlookAccounts: [{ id: "outlook-1", user_id: "user-1" }],
    contacts: [{ id: "contact-1", company_id: "company-1", full_name: null, first_name: "Sarah" }],
    companies: [{ id: "company-1", organization_id: "org-1" }],
    enabledOrganizationIds: ["org-1"],
    existingBatchIds: new Set(["email_followup:4d:2d:org-1:user-1:2026-05-29"]),
    reminderDays: 4,
    dedupeWindowDays: 2,
    maxContactsPerNotification: 6,
    now,
  });

  assert.deepEqual(planned, []);
});
