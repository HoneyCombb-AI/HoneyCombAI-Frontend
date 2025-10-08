# Development Process: Adding CSV Import Fields

This document outlines the general process for adding new database fields to a CSV import feature in a full-stack application with Supabase.

## Overview

When adding new fields to an existing CSV import system, you need to update multiple layers of your application stack. This guide walks through a systematic approach to ensure consistency across all layers.

## Tech Stack Context

- **Frontend**: React/Next.js with TypeScript
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **CSV Processing**: Papa Parse library

## The Problem

We had a CSV import feature that only imported basic company information (name and URL). However, our database schema supported many more company fields like:
- Industry
- Location (city, state, country)
- LinkedIn URL
- And more...

These fields were empty after import, even though the CSV data might contain this information.

## Step-by-Step Process

### 1. Database Schema Analysis

**Goal**: Understand what fields are available in your database tables.

**Actions**:
- Use Supabase MCP tools or SQL queries to inspect table structure
- List all available columns in the target tables
- Identify which fields are nullable vs required
- Check data types (text, arrays, jsonb, etc.)

**Output**: A clear list of available fields and their types.

### 2. UI/Frontend Updates

**Goal**: Document and communicate available CSV headers to users.

**Actions**:
- Update CSV header constants with new field names
- Add new fields to sample data/templates
- Update UI documentation showing optional vs required fields
- Add visual sections grouping related fields (e.g., "Company Info", "Additional Company Info")
- Make it clear which fields are optional and which are required
- Implement downloadable CSV templates

**Key Decisions**:
- **Header naming convention**: Use snake_case without spaces (e.g., `company_linkedin_url`)
- **Required vs Optional**: Decide whether all headers must be present in CSV, even if empty
- **User Experience**: Balance flexibility vs simplicity

**We chose**: Require all headers (even if empty) because:
- Simpler validation logic
- Users can download a template with all headers
- Clearer documentation of available fields

### 3. API Route Updates

**Goal**: Update the backend to accept and validate new fields.

**Actions**:
- Update `EXPECTED_HEADERS` array with new field names
- Update TypeScript interfaces (`CSVContactData`) to include new fields
- Ensure header validation checks for all required headers
- Keep validation logic consistent with frontend

**Important**: The API layer should validate structure, not business logic.

### 4. Database Function (RPC) Updates

**Goal**: Update the database function to handle new fields.

**Process**:
1. **Backup first**: Always create a backup of the current RPC function
2. **Identify changes needed**:
   - Add new fields to INSERT statements
   - Add new fields to the `jsonb_to_recordset` mapping
   - Add cleaning/trimming logic for new fields
3. **Handle edge cases**:
   - NULL value handling
   - Duplicate detection
   - Conflict resolution

**Critical Issue We Encountered**:
When multiple contacts from the same company exist in one CSV, the INSERT statement tried to insert duplicate companies, causing an error:
```
"ON CONFLICT DO UPDATE command cannot affect row a second time"
```

**Solution**:
Use `SELECT DISTINCT ON` to ensure only one company insert per unique company_url:
```sql
SELECT DISTINCT ON (company_url, p_user_id, p_organization_id)
  -- fields
FROM jsonb_array_elements(contacts_data)
```

### 5. Rate Limiting Optimization

**Problem Discovered**: Rate limiting was applied too early, before validation.

**Issue**: Users were penalized (rate limit consumed) even when:
- CSV format was invalid
- Headers were missing
- Organization wasn't set up
- Server errors occurred

**Solution**: Move rate limiting to happen **after all validations pass**, but **before the actual work**:

```
1. Auth check
2. File validation
3. CSV parsing validation
4. Header validation
5. Organization checks
6. ✅ RATE LIMIT HERE ✅
7. Execute RPC function
```

This ensures users only consume rate limit quota when they're about to perform actual work.

## General Principles Learned

### 1. Work Top-Down
- Start with understanding the database schema
- Move to UI/UX decisions
- Then update API layer
- Finally update database functions

### 2. Always Backup
- Before modifying database functions, save a backup
- Use version control for all code changes
- Document what changed and why

### 3. Think About Edge Cases
- What if CSV has duplicate data?
- What if fields are empty vs missing?
- What if users upload the same data twice?

### 4. User Experience Matters
- Clear error messages
- Don't penalize users for validation errors
- Provide templates and examples
- Make optional vs required very clear

### 5. Validate Early, Rate Limit Late
- Validate input as early as possible
- Rate limit as late as possible (but before expensive operations)
- This provides better UX and prevents abuse

### 6. Field Naming Conventions
- Be consistent (snake_case vs camelCase)
- Avoid spaces in header names
- Use descriptive prefixes (e.g., `company_` for company fields)

### 7. Testing Approach
- Test with minimal data first
- Test with edge cases (duplicates, missing fields)
- Test with real-world data exports (Apollo, LinkedIn Sales Nav)
- Check both success and failure scenarios

## File Structure

When making these changes, we touched:

```
project/
├── components/
│   └── dashboard/
│       └── Contacts/
│           └── ImportContactsDrawer.tsx    # UI updates
├── app/
│   └── api/
│       └── contacts/
│           └── create/
│               └── bulk/
│                   └── route.ts            # API route updates
└── supabase/
    └── functions/
        ├── import_contacts_bulk_BACKUP.sql     # Backup
        └── import_contacts_bulk_UPDATED.sql    # New version
```

## Key Takeaways

1. **Systematic Approach**: Work through each layer methodically
2. **Database First**: Understanding your schema is crucial
3. **Backup Everything**: Always have a rollback plan
4. **User-Centric**: Think about the user experience at every step
5. **Handle Duplicates**: CSV imports often have duplicate data
6. **Rate Limiting**: Apply it at the right point in the flow
7. **Documentation**: Update docs as you update code

## Communication with AI Assistant

When working with an AI assistant on such tasks:

1. **Start with the problem**: Explain what you're trying to achieve
2. **Share context**: Provide database schema, current code
3. **Ask for analysis first**: Before making changes, understand what's needed
4. **Review suggestions**: Don't blindly implement, understand the why
5. **Iterate**: Make changes step by step, test, and refine
6. **Ask "why" questions**: Understand trade-offs and implications

## Conclusion

Adding fields to a CSV import system requires coordinated changes across multiple layers. By following a systematic approach, backing up critical code, and thinking about edge cases and user experience, you can implement changes safely and effectively.

The key is not to rush—take time to understand each layer, test thoroughly, and document your changes for future reference.
