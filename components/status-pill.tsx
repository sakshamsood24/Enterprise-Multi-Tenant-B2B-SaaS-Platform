type StatusPillProps = {
  children: React.ReactNode;
  tone?: "green" | "blue" | "amber" | "slate";
};

const tones = {
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  slate: "border-slate-200 bg-slate-50 text-slate-700"
};

export function StatusPill({ children, tone = "slate" }: StatusPillProps) {
  return <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}
