import type { SubscriptionTier, TenantContext, TenantRole } from "@/lib/types";

const roleRank: Record<TenantRole, number> = {
  viewer: 0,
  operator: 1,
  admin: 2,
  owner: 3
};

const tierRank: Record<SubscriptionTier, number> = {
  free: 0,
  growth: 1,
  enterprise: 2
};

export function requireRole(ctx: TenantContext, minimumRole: TenantRole) {
  if (roleRank[ctx.role] < roleRank[minimumRole]) {
    throw Object.assign(new Error(`Requires ${minimumRole} role or higher`), { status: 403 });
  }
}

export function requireActiveSubscription(ctx: TenantContext) {
  if (ctx.subscriptionStatus !== "active" && ctx.subscriptionStatus !== "trialing") {
    throw Object.assign(new Error("Subscription is not active"), { status: 402 });
  }
}

export function requireSubscriptionTier(ctx: TenantContext, minimumTier: SubscriptionTier) {
  requireActiveSubscription(ctx);

  if (tierRank[ctx.subscriptionTier] < tierRank[minimumTier]) {
    throw Object.assign(new Error(`Requires ${minimumTier} subscription tier or higher`), {
      status: 402
    });
  }
}

export function errorResponse(error: unknown) {
  const status = typeof error === "object" && error !== null && "status" in error ? Number(error.status) : 500;
  const message = error instanceof Error ? error.message : "Unexpected server error";

  return Response.json({ error: message }, { status: Number.isFinite(status) ? status : 500 });
}
