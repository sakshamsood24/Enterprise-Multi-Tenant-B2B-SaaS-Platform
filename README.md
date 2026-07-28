# Enterprise Multi-Tenant B2B SaaS Platform

A recruiter-facing reference implementation of a business SaaS platform with tenant isolation, RBAC, subscription gates, and Redis-backed tenant rate limits.

The demo domain is an asset and vendor operations platform: each company manages assets, vendors, and activity within a shared database, while PostgreSQL Row-Level Security prevents cross-tenant data exposure even if application code forgets a `tenant_id` filter.

## Stack

- Next.js App Router
- Supabase Auth + PostgreSQL
- PostgreSQL Row-Level Security using JWT claims
- Redis-compatible rate limiting via Upstash
- TypeScript, Tailwind CSS

## What to review first

- [supabase/schema.sql](supabase/schema.sql) — tables, RLS policies, seed data, JWT helper functions
- [lib/tenant-context.ts](lib/tenant-context.ts) — extracts tenant, role, and subscription claims
- [lib/guards.ts](lib/guards.ts) — RBAC and subscription enforcement
- [middleware.ts](middleware.ts) — session refresh and dashboard protection
- [app/api/assets/route.ts](app/api/assets/route.ts) — tenant-safe API reads/writes
- [app/api/vendors/route.ts](app/api/vendors/route.ts) — heavy operation protected by subscription tier and tenant rate limit

## Local setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Configure Auth JWT custom claims so access tokens include:
   - `tenant_id`
   - `tenant_role`
   - `subscription_tier`
   - `subscription_status`
4. Copy `.env.example` to `.env.local` and fill in values.
5. Install dependencies and run:

```bash
npm install
npm run dev
```

## Security model

Application code still passes tenant context for clarity, but the database is the final boundary. All tenant-owned tables enable RLS and use policies based on JWT claims. If an engineer accidentally writes `select * from assets`, PostgreSQL still returns only rows for the tenant encoded in the user token.
