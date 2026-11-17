import Link from "next/link";
import { CalendarDays, CircleDollarSign, Clock3, FileCheck2, Plus } from "lucide-react";
import type { Collaboration } from "@/app/calendar/actions";
import type { Invoice, InvoiceStatus } from "@/app/invoices/actions";

type OverviewProps = {
  collaborations: Collaboration[];
  invoices: Invoice[];
  errors?: string[];
};

const money = new Intl.NumberFormat("en-MY", {
  style: "currency",
  currency: "MYR",
  maximumFractionDigits: 0,
});

function dateTimeLabel(value: string) {
  return new Date(value).toLocaleString("en-MY", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function deadlineParts(value: string) {
  const date = new Date(value);
  return {
    day: date.toLocaleDateString("en-MY", { day: "2-digit" }),
    month: date.toLocaleDateString("en-MY", { month: "short" }),
  };
}

function invoiceTotal(invoice: Invoice) {
  const subtotal = invoice.quantity * invoice.unitPrice;
  return subtotal - subtotal * invoice.discountRate / 100;
}

function CollaborationStatus({ status }: { status: Collaboration["status"] }) {
  const colors = status === "Posted" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700";
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${colors}`}>{status}</span>;
}

function InvoiceStatusPill({ status }: { status?: InvoiceStatus }) {
  const label = status ?? "No invoice";
  const colors = status === "Paid"
    ? "bg-emerald-50 text-emerald-700"
    : status === "Unpaid"
      ? "bg-rose-50 text-rose-600"
      : "bg-slate-100 text-slate-500";
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${colors}`}>{label}</span>;
}

function MetricCard({ label, value, detail, icon, accent }: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 transition-shadow hover:shadow-md" style={{ borderTop: `3px solid ${accent}` }}>
      <div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-500">{label}</span><div className="flex size-9 items-center justify-center rounded-xl bg-slate-50">{icon}</div></div>
      <div className="mt-4 text-[26px] font-bold leading-none text-slate-900">{value}</div>
      <div className="mt-2 text-xs font-medium text-slate-400">{detail}</div>
    </div>
  );
}

export default function Overview({ collaborations, invoices, errors = [] }: OverviewProps) {
  const now = new Date();
  const sevenDaysFromNow = new Date(now);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const totalExpected = collaborations.reduce((sum, item) => sum + item.payment, 0);
  const paidInvoices = invoices.filter((invoice) => invoice.status === "Paid");
  const unpaidInvoices = invoices.filter((invoice) => invoice.status === "Unpaid");
  const paidTotal = paidInvoices.reduce((sum, invoice) => sum + invoiceTotal(invoice), 0);
  const unpaidTotal = unpaidInvoices.reduce((sum, invoice) => sum + invoiceTotal(invoice), 0);
  const posted = collaborations.filter((item) => item.status === "Posted");
  const invoiceByCollaboration = new Map(invoices.map((invoice) => [invoice.collaborationId, invoice]));

  const upcoming = collaborations
    .filter((item) => new Date(item.visitDate) >= now)
    .sort((a, b) => a.visitDate.localeCompare(b.visitDate));
  const deadlines = collaborations
    .filter((item): item is Collaboration & { deadline: string } => Boolean(item.deadline) && new Date(item.deadline!) >= now)
    .sort((a, b) => a.deadline.localeCompare(b.deadline));
  const nextSevenDays = deadlines.filter((item) => new Date(item.deadline) <= sevenDaysFromNow);

  const chartMonths = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return {
      key,
      label: date.toLocaleDateString("en-MY", { month: "short" }),
      total: collaborations
        .filter((item) => item.visitDate.startsWith(key))
        .reduce((sum, item) => sum + item.payment, 0),
    };
  });
  const chartMax = Math.max(...chartMonths.map((item) => item.total), 1);

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-5 p-6 pb-12 md:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div><h1 className="text-2xl font-bold text-slate-900">Overview</h1><p className="mt-0.5 text-sm text-slate-400">{now.toLocaleDateString("en-MY", { month: "long", year: "numeric" })} · Your business at a glance</p></div>
        <Link href="/collaborations" className="inline-flex items-center gap-2 self-start rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-indigo-700"><Plus size={16} /> New collaboration</Link>
      </div>

      {errors.map((error) => <div key={error} role="alert" className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>)}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Expected Income" value={money.format(totalExpected)} detail={`${collaborations.length} total collaborations`} accent="#6366F1" icon={<CircleDollarSign size={18} className="text-indigo-600" />} />
        <MetricCard label="Paid Income" value={money.format(paidTotal)} detail={`${paidInvoices.length} paid invoices`} accent="#10B981" icon={<FileCheck2 size={18} className="text-emerald-500" />} />
        <MetricCard label="Outstanding" value={money.format(unpaidTotal)} detail={`${unpaidInvoices.length} unpaid invoices`} accent="#F43F5E" icon={<CalendarDays size={18} className="text-rose-500" />} />
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
          <div className="mb-4 flex items-center justify-between"><div><h2 className="text-base font-bold text-slate-800">Upcoming Deadlines</h2><p className="mt-0.5 text-xs text-slate-400">{posted.length} collaborations posted</p></div><Link href="/calendar" className="text-xs font-semibold text-indigo-500 hover:text-indigo-700">View calendar</Link></div>
          <div>{deadlines.slice(0, 4).map((item) => {
            const date = deadlineParts(item.deadline);
            return <div key={item.id} className="flex items-center gap-3 border-b border-slate-50 py-3 last:border-0"><div className="flex size-11 shrink-0 flex-col items-center justify-center rounded-xl bg-amber-50 font-bold text-amber-600"><span className="text-sm leading-none">{date.day}</span><span className="mt-1 text-[9px] uppercase leading-none">{date.month}</span></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-700">{item.name}</p><p className="mt-0.5 truncate text-xs text-slate-400">{item.postingType} · {dateTimeLabel(item.deadline)}</p></div></div>;
          })}{!deadlines.length && <p className="py-8 text-center text-sm text-slate-400">No upcoming deadlines.</p>}</div>
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="text-base font-bold text-slate-800">Upcoming Collaborations</h2><p className="mt-0.5 text-xs text-slate-400">{upcoming.length} upcoming visits</p></div><Link href="/collaborations" className="text-xs font-semibold text-indigo-500 hover:text-indigo-700">View all</Link></div>
        <div>{upcoming.slice(0, 5).map((item) => {
          const invoice = invoiceByCollaboration.get(item.id);
          return <div key={item.id} className="flex items-center gap-4 border-b border-slate-50 px-5 py-3.5 last:border-0"><div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-xs font-bold text-white">{item.name.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase()}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="truncate text-sm font-semibold text-slate-800">{item.name}</span><CollaborationStatus status={item.status} /><InvoiceStatusPill status={invoice?.status} /></div><p className="mt-0.5 truncate text-xs text-slate-400">{item.description || `${item.postingType} · ${item.deadline ? `deadline ${dateTimeLabel(item.deadline)}` : "deadline not set"}`}</p></div><div className="shrink-0 text-right"><div className="text-sm font-bold text-slate-800">{money.format(item.payment)}</div><div className="mt-0.5 text-xs text-slate-400">{dateTimeLabel(item.visitDate)}</div></div></div>;
        })}{!upcoming.length && <p className="px-5 py-10 text-center text-sm text-slate-400">No upcoming collaborations. Add one from the collaborations page.</p>}</div>
      </section>
    </div>
  );
}
