import Link from "next/link";
import { CalendarDays, CircleDollarSign, Clock3, FileCheck2, Plus } from "lucide-react";
import type { Collaboration } from "@/app/calendar/actions";

type OverviewProps = { collaborations: Collaboration[]; error?: string | null };
const money = new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR", maximumFractionDigits: 0 });

function dateLabel(value: string) {
  return new Date(value).toLocaleString("en-MY", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function StatusPill({ status }: { status: Collaboration["status"] }) {
  return <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${status === "Posted" ? "bg-teal-50 text-teal-600" : "bg-violet-50 text-violet-600"}`}>{status}</span>;
}

function MetricCard({ label, value, detail, icon, accent }: { label: string; value: string; detail: string; icon: React.ReactNode; accent: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 transition-shadow hover:shadow-md" style={{ borderTop: `3px solid ${accent}` }}>
      <div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-500">{label}</span><div className="flex size-9 items-center justify-center rounded-xl bg-slate-50">{icon}</div></div>
      <div className="mt-4 text-[26px] font-bold leading-none text-slate-900">{value}</div>
      <div className="mt-2 text-xs font-medium text-slate-400">{detail}</div>
    </div>
  );
}

export default function Overview({ collaborations, error }: OverviewProps) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const monthStart = today.slice(0, 7);
  const sevenDays = new Date(now);
  sevenDays.setDate(sevenDays.getDate() + 7);
  const nextWeek = `${sevenDays.getFullYear()}-${String(sevenDays.getMonth() + 1).padStart(2, "0")}-${String(sevenDays.getDate()).padStart(2, "0")}`;
  const totalIncome = collaborations.reduce((sum, item) => sum + item.payment, 0);
  const scheduled = collaborations.filter((item) => item.status === "Scheduled");
  const posted = collaborations.filter((item) => item.status === "Posted");
  const thisMonth = collaborations.filter((item) => item.visitDate.startsWith(monthStart));
  const upcoming = [...collaborations].filter((item) => item.visitDate >= today).sort((a, b) => a.visitDate.localeCompare(b.visitDate));
  const deadlines = [...collaborations].filter((item) => item.deadline >= today).sort((a, b) => a.deadline.localeCompare(b.deadline));
  const nextSevenDays = deadlines.filter((item) => item.deadline <= nextWeek);
  const chartMonths = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return { key, label: date.toLocaleDateString("en-MY", { month: "short" }), total: collaborations.filter((item) => item.visitDate.startsWith(key)).reduce((sum, item) => sum + item.payment, 0) };
  });
  const chartMax = Math.max(...chartMonths.map((item) => item.total), 1);

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-5 p-6 pb-12 md:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div><h1 className="text-2xl font-bold text-slate-900">Overview</h1><p className="mt-0.5 text-sm text-slate-400">{now.toLocaleDateString("en-MY", { month: "long", year: "numeric" })} · Your business at a glance</p></div>
        <Link href="/calendar" className="inline-flex items-center gap-2 self-start rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-indigo-700"><Plus size={16} /> New Collaboration</Link>
      </div>
      {error && <div role="alert" className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <MetricCard label="Expected Income" value={money.format(totalIncome)} detail={`${collaborations.length} total collaborations`} accent="#6366F1" icon={<CircleDollarSign size={18} className="text-indigo-600" />} />
        <MetricCard label="Scheduled Income" value={money.format(scheduled.reduce((sum, item) => sum + item.payment, 0))} detail={`${scheduled.length} scheduled`} accent="#3B82F6" icon={<CalendarDays size={18} className="text-blue-500" />} />
        <MetricCard label="Posted Content" value={String(posted.length)} detail="completed posts" accent="#10B981" icon={<FileCheck2 size={18} className="text-emerald-500" />} />
        <MetricCard label="Upcoming Deadlines" value={String(nextSevenDays.length)} detail="within the next 7 days" accent="#F59E0B" icon={<Clock3 size={18} className="text-amber-500" />} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <section className="rounded-2xl border border-slate-100 bg-white p-5 lg:col-span-3">
          <div className="mb-6 flex items-start justify-between"><div><h2 className="text-base font-bold text-slate-800">Monthly Expected Income</h2><p className="mt-0.5 text-xs text-slate-400">Based on collaboration visit dates</p></div><span className="text-lg font-bold text-indigo-600">{money.format(chartMonths.at(-1)?.total ?? 0)}</span></div>
          <div className="flex h-52 items-end gap-3" role="img" aria-label="Expected collaboration income for the last six months">
            {chartMonths.map((item) => <div key={item.key} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><span className="text-[10px] font-medium text-slate-400">{item.total ? money.format(item.total) : ""}</span><div className="w-full max-w-12 rounded-t-lg bg-indigo-500" style={{ height: `${Math.max((item.total / chartMax) * 150, item.total ? 8 : 2)}px`, opacity: item.total ? 1 : 0.15 }} /><span className="text-xs text-slate-400">{item.label}</span></div>)}
          </div>
        </section>
        <section className="rounded-2xl border border-slate-100 bg-white p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-base font-bold text-slate-800">Upcoming Deadlines</h2><Link href="/calendar" className="text-xs font-semibold text-indigo-500 hover:text-indigo-700">View calendar</Link></div>
          <div>{deadlines.slice(0, 4).map((item) => <div key={item.id} className="flex items-center gap-3 border-b border-slate-50 py-3 last:border-0"><div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-xs font-bold text-amber-600">{dateLabel(item.deadline)}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-700">{item.name}</p><p className="mt-0.5 text-xs text-slate-400">{item.postingType} · {money.format(item.payment)}</p></div></div>)}{!deadlines.length && <p className="py-8 text-center text-sm text-slate-400">No upcoming deadlines.</p>}</div>
        </section>
      </div>
      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="text-base font-bold text-slate-800">Upcoming Collaborations</h2><p className="mt-0.5 text-xs text-slate-400">{thisMonth.length} scheduled this month</p></div><Link href="/calendar" className="text-xs font-semibold text-indigo-500 hover:text-indigo-700">View all</Link></div>
        <div>{upcoming.slice(0, 5).map((item) => <div key={item.id} className="flex items-center gap-4 border-b border-slate-50 px-5 py-3.5 last:border-0"><div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-xs font-bold text-white">{item.name.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase()}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="truncate text-sm font-semibold text-slate-800">{item.name}</span><StatusPill status={item.status} /></div><p className="mt-0.5 text-xs text-slate-400">{item.postingType} · deadline {dateLabel(item.deadline)}</p></div><div className="shrink-0 text-right"><div className="text-sm font-bold text-slate-800">{money.format(item.payment)}</div><div className="mt-0.5 text-xs text-slate-400">{dateLabel(item.visitDate)}</div></div></div>)}{!upcoming.length && <p className="px-5 py-10 text-center text-sm text-slate-400">No upcoming collaborations. Add one from the calendar.</p>}</div>
      </section>
    </div>
  );
}
