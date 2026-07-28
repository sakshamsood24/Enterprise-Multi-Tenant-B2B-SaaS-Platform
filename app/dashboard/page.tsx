import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireTenantContext } from "@/lib/tenant-context";
import { StatusPill } from "@/components/status-pill";

export default async function DashboardPage() {
  const ctx = await requireTenantContext();
  const supabase = await createSupabaseServerClient();

  const [{ data: assets }, { data: vendors }, { data: auditEvents }] = await Promise.all([
    supabase.from("assets").select("id,name,status,replacement_value_cents,created_at").order("created_at", {
      ascending: false
    }),
    supabase.from("vendors").select("id,name,category,risk_score").order("risk_score", { ascending: false }),
    supabase.from("audit_events").select("id,event_name,entity_table,created_at").limit(5)
  ]);

  return (
    <main className="min-h-screen px-6 py-8">
      <section className="mx-auto max-w-6xl space-y-6">
        <div className="card flex flex-col justify-between gap-4 p-6 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand">Secure tenant workspace</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">Operations dashboard</h1>
            <p className="mt-2 text-slate-600">Tenant claim: {ctx.tenantId}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusPill tone="blue">{ctx.role}</StatusPill>
            <StatusPill tone={ctx.subscriptionStatus === "active" ? "green" : "amber"}>
              {ctx.subscriptionTier} / {ctx.subscriptionStatus}
            </StatusPill>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="card p-6 lg:col-span-2">
            <h2 className="text-xl font-black">Assets</h2>
            <div className="mt-5 divide-y divide-slate-100">
              {(assets ?? []).map((asset) => (
                <div className="flex items-center justify-between py-4" key={asset.id}>
                  <div>
                    <div className="font-bold">{asset.name}</div>
                    <div className="text-sm text-slate-500">{asset.status}</div>
                  </div>
                  <div className="text-sm font-semibold">
                    ${(asset.replacement_value_cents / 100).toLocaleString()}
                  </div>
                </div>
              ))}
              {assets?.length === 0 ? <p className="py-4 text-slate-500">No tenant-visible assets yet.</p> : null}
            </div>
          </section>

          <section className="card p-6">
            <h2 className="text-xl font-black">Vendor risk</h2>
            <div className="mt-5 space-y-3">
              {(vendors ?? []).map((vendor) => (
                <div className="rounded-2xl bg-slate-50 p-4" key={vendor.id}>
                  <div className="font-bold">{vendor.name}</div>
                  <div className="mt-1 text-sm text-slate-500">
                    {vendor.category} · risk {vendor.risk_score}
                  </div>
                </div>
              ))}
              {vendors?.length === 0 ? <p className="text-slate-500">No tenant-visible vendors yet.</p> : null}
            </div>
          </section>
        </div>

        <section className="card p-6">
          <h2 className="text-xl font-black">Audit trail</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {(auditEvents ?? []).map((event) => (
              <div className="rounded-2xl bg-slate-50 p-4 text-sm" key={event.id}>
                <span className="font-bold">{event.event_name}</span> on {event.entity_table}
              </div>
            ))}
            {auditEvents?.length === 0 ? <p className="text-slate-500">Admins will see tenant audit events here.</p> : null}
          </div>
        </section>
      </section>
    </main>
  );
}
