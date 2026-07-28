import Link from "next/link";
import { ShieldCheck, Gauge, Building2, LockKeyhole } from "lucide-react";
import { StatusPill } from "@/components/status-pill";

const features = [
  {
    icon: ShieldCheck,
    title: "Database-enforced tenant isolation",
    body: "Every tenant-owned table has RLS enabled, and policies use JWT tenant claims instead of trusting app-side filters."
  },
  {
    icon: LockKeyhole,
    title: "RBAC for business workflows",
    body: "Owners, admins, operators, and viewers get progressively scoped access to assets, vendors, and audit logs."
  },
  {
    icon: Gauge,
    title: "Subscription-aware API gates",
    body: "Heavy endpoints check plan tier and active subscription state before they execute expensive work."
  },
  {
    icon: Building2,
    title: "Shared database, separate companies",
    body: "A single set of tables supports many companies while preventing accidental cross-tenant reads."
  }
];

export default function Home() {
  return (
    <main className="min-h-screen px-6 py-10">
      <section className="mx-auto flex max-w-6xl flex-col gap-10">
        <nav className="flex items-center justify-between">
          <div className="text-xl font-black tracking-tight">TenantOps</div>
          <Link className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white" href="/dashboard">
            Open dashboard
          </Link>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-7">
            <StatusPill tone="blue">PostgreSQL RLS + RBAC + subscriptions</StatusPill>
            <div className="space-y-5">
              <h1 className="max-w-4xl text-5xl font-black leading-[1.02] tracking-tight md:text-7xl">
                A serious B2B SaaS architecture, without the hand-wavy bits.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                TenantOps is a multi-tenant asset and vendor operations platform. It demonstrates the security
                patterns recruiters look for: shared tables, row-level isolation, role-aware workflows, and
                plan-aware API controls.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link className="rounded-full bg-brand px-6 py-3 text-sm font-bold text-white" href="/dashboard">
                View secure dashboard
              </Link>
              <a className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-bold" href="/api/assets">
                Try tenant API
              </a>
            </div>
          </div>

          <div className="card p-6">
            <div className="rounded-2xl bg-ink p-5 text-white">
              <div className="text-sm text-slate-300">Isolation guarantee</div>
              <pre className="mt-4 overflow-x-auto text-sm leading-6 text-blue-100">
                {`select * from assets;

-- Still returns only:
-- tenant_id = jwt.claims.tenant_id
-- because PostgreSQL RLS is enabled`}
              </pre>
            </div>
            <div className="mt-5 grid gap-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-slate-50 p-4">Tenant A cannot query Tenant B rows.</div>
              <div className="rounded-2xl bg-slate-50 p-4">Past-due accounts are blocked from writes.</div>
              <div className="rounded-2xl bg-slate-50 p-4">Free plans are denied heavy API operations.</div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <article className="card p-6" key={feature.title}>
              <feature.icon className="h-6 w-6 text-brand" />
              <h2 className="mt-5 font-bold">{feature.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{feature.body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
