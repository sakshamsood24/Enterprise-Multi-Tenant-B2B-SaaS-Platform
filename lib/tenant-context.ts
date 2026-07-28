import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SubscriptionStatus, SubscriptionTier, TenantContext, TenantRole } from "@/lib/types";

function asTenantRole(value: unknown): TenantRole {
  if (value === "owner" || value === "admin" || value === "operator" || value === "viewer") {
    return value;
  }
  return "viewer";
}

function asSubscriptionTier(value: unknown): SubscriptionTier {
  if (value === "enterprise" || value === "growth" || value === "free") {
    return value;
  }
  return "free";
}

function asSubscriptionStatus(value: unknown): SubscriptionStatus {
  if (value === "trialing" || value === "active" || value === "past_due" || value === "canceled") {
    return value;
  }
  return "canceled";
}

export async function requireTenantContext(): Promise<TenantContext> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw Object.assign(new Error("Authentication required"), { status: 401 });
  }

  const tenantId = user.app_metadata?.tenant_id ?? user.user_metadata?.tenant_id;

  if (typeof tenantId !== "string" || tenantId.length === 0) {
    throw Object.assign(new Error("User is not attached to a tenant"), { status: 403 });
  }

  return {
    userId: user.id,
    tenantId,
    role: asTenantRole(user.app_metadata?.tenant_role ?? user.user_metadata?.tenant_role),
    subscriptionTier: asSubscriptionTier(
      user.app_metadata?.subscription_tier ?? user.user_metadata?.subscription_tier
    ),
    subscriptionStatus: asSubscriptionStatus(
      user.app_metadata?.subscription_status ?? user.user_metadata?.subscription_status
    )
  };
}
