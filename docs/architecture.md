# Architecture Notes

## Tenancy

The platform uses a shared-table tenancy model:

- `tenants` stores company accounts.
- Every tenant-owned business table includes `tenant_id`.
- RLS policies compare each row's `tenant_id` with `auth.jwt() ->> 'tenant_id'`.

This means the database is not relying on every application query to remember `where tenant_id = ...`. The app can and should still include tenant context, but accidental omissions are contained by PostgreSQL.

## Auth claims

Supabase Auth access tokens should include:

```json
{
  "tenant_id": "uuid",
  "tenant_role": "owner | admin | operator | viewer",
  "subscription_tier": "free | growth | enterprise",
  "subscription_status": "trialing | active | past_due | canceled"
}
```

The SQL file includes `public.set_tenant_claims(event jsonb)` as a custom access-token hook candidate. In a production app, support multi-tenant user switching by storing an `active_tenant_id` preference and validating it against `tenant_memberships` inside the hook.

## RBAC

Roles are ordered by privilege:

1. `viewer`
2. `operator`
3. `admin`
4. `owner`

Application guards reject requests early. RLS policies also enforce write restrictions so a past-due tenant or read-only role cannot bypass the app by calling Supabase directly with a user token.

## Subscription gating

Heavy API operations use two checks:

- `requireSubscriptionTier(ctx, "growth")` blocks insufficient or inactive plans.
- `tenantRateLimit(...)` limits the operation per tenant, not merely per user.

That combination prevents one noisy user from being evaded by creating another user in the same company.

## Recruiter walkthrough

1. Open `supabase/schema.sql` and show that RLS is enabled on tenant tables.
2. Point at a GET route that intentionally omits a tenant filter.
3. Explain that this is safe because RLS filters rows using JWT claims.
4. Show `POST /api/vendors` as the paid-tier operation with Redis tenant rate limiting.
5. Show the dashboard reading assets, vendors, and audit events from shared tables.
