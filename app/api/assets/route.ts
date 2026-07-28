import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { errorResponse, requireActiveSubscription, requireRole } from "@/lib/guards";
import { requireTenantContext } from "@/lib/tenant-context";

const createAssetSchema = z.object({
  name: z.string().min(2).max(120),
  serialNumber: z.string().min(2).max(80).optional(),
  vendorId: z.string().uuid().optional(),
  replacementValueCents: z.number().int().min(0).default(0)
});

export async function GET() {
  try {
    await requireTenantContext();
    const supabase = await createSupabaseServerClient();

    // Intentionally no tenant_id filter here.
    // PostgreSQL RLS still restricts this query to the caller's tenant.
    const { data, error } = await supabase
      .from("assets")
      .select("id,name,serial_number,status,replacement_value_cents,created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return Response.json({ data });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireTenantContext();
    requireRole(ctx, "operator");
    requireActiveSubscription(ctx);

    const body = createAssetSchema.parse(await request.json());
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("assets")
      .insert({
        tenant_id: ctx.tenantId,
        vendor_id: body.vendorId,
        name: body.name,
        serial_number: body.serialNumber,
        replacement_value_cents: body.replacementValueCents,
        created_by: ctx.userId
      })
      .select("id,name,status")
      .single();

    if (error) throw error;

    await supabase.from("audit_events").insert({
      tenant_id: ctx.tenantId,
      actor_id: ctx.userId,
      event_name: "asset.created",
      entity_table: "assets",
      entity_id: data.id,
      metadata: { name: data.name }
    });

    return Response.json({ data }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
