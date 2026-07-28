import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TenantOps | Multi-Tenant B2B SaaS",
  description: "A secure multi-tenant SaaS reference app with PostgreSQL RLS, RBAC, subscriptions, and rate limits."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
