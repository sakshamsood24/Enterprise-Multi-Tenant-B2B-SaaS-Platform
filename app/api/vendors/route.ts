import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { errorResponse, requireRole, requireSubscriptionTier } from "@/lib/guards";
import { tenantRateLimit } from "@/lib/rate-limit";
import { requireTenantContext } from "@/lib/tenant-context";

const createVendorSchema = z.object({
  name: z.string().min(2).max(120),
  category: z.string().min(2).max(80),
  riskScore: z.number().int().min(0).max(100).default(0)
});

export async function GET() {
  try {
    await requireTenantContext();
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("vendors")
      .select("id,name,category,risk_score,created_at")
      .order("risk_score", { ascending: false });

    if (error) throw error;

    return Response.json({ data });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireTenantContext();
    requireRole(ctx, "admin");
    requireSubscriptionTier(ctx, "growth");

    const limit = await tenantRateLimit(ctx.tenantId, "vendor-create", 30, 60);
    if (!limit.allowed) {
      return Response.json(
        { error: "Tenant rate limit exceeded", resetAt: limit.resetAt },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": String(limit.remaining),
            "X-RateLimit-Reset": String(limit.resetAt)
          }
        }
      );
    }

    const body = createVendorSchema.parse(await request.json());
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("vendors")
      .insert({
        tenant_id: ctx.tenantId,
        name: body.name,
        category: body.category,
        risk_score: body.riskScore,
        created_by: ctx.userId
      })
      .select("id,name,category,risk_score")
      .single();

    if (error) throw error;

    await supabase.from("audit_events").insert({
      tenant_id: ctx.tenantId,
      actor_id: ctx.userId,
      event_name: "vendor.created",
      entity_table: "vendors",
      entity_id: data.id,
      metadata: { name: data.name, category: data.category }
    });

    return Response.json(
      { data },
      {
        status: 201,
        headers: {
          "X-RateLimit-Remaining": String(limit.remaining),
          "X-RateLimit-Reset": String(limit.resetAt)
        }
      }
    );
  } catch (error) {
    return errorResponse(error);
  }
}
