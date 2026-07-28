import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <section className="card w-full max-w-md p-8">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand">TenantOps</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight">Connect Supabase Auth</h1>
        <p className="mt-4 leading-7 text-slate-600">
          This scaffold expects Supabase Auth cookies. Add your preferred magic-link, SSO, or password flow here, then
          ensure access tokens include tenant and subscription claims.
        </p>
        <Link className="mt-6 inline-flex rounded-full bg-ink px-5 py-3 text-sm font-bold text-white" href="/">
          Back to overview
        </Link>
      </section>
    </main>
  );
}
