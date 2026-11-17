"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { Download, FilePlus2, Pencil, Search, Trash2, X } from "lucide-react";
import type { Collaboration } from "@/app/calendar/actions";
import { deleteInvoice, saveInvoice, type Invoice, type InvoiceInput, type InvoiceStatus } from "@/app/invoices/actions";
import { InvoiceTemplate } from "./invoice-template";

const money = new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" });

function localDate(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function emptyInvoice(count: number): InvoiceInput {
  const issue = new Date();
  return {
    collaborationId: null,
    invoiceNumber: `INV-${issue.getFullYear()}${String(issue.getMonth() + 1).padStart(2, "0")}-${String(count + 1).padStart(3, "0")}`,
    clientName: "",
    clientAddress: "",
    issueDate: localDate(issue),
    currency: "MYR",
    itemDescription: "Content creation services",
    quantity: 1,
    unitPrice: 0,
    discountRate: 0,
    status: "Unpaid",
  };
}

function invoiceInput(invoice: Invoice): InvoiceInput {
  const { createdAt: _createdAt, ...input } = invoice;
  void _createdAt;
  return input;
}

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const color = status === "Paid" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${color}`}>{status}</span>;
}

export default function InvoiceManager({ initialInvoices, collaborations, initialError }: {
  initialInvoices: Invoice[];
  collaborations: Collaboration[];
  initialError: string | null;
}) {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [draft, setDraft] = useState<InvoiceInput>(() => emptyInvoice(initialInvoices.length));
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Not invoiced" | InvoiceStatus>("All");
  const [message, setMessage] = useState(initialError ?? "");
  const [pending, startTransition] = useTransition();
  const dialog = useRef<HTMLDialogElement>(null);

  const subtotal = draft.quantity * draft.unitPrice;
  const total = subtotal - subtotal * draft.discountRate / 100;
  const filtered = collaborations.filter((collaboration) => {
    const invoice = invoices.find((item) => item.collaborationId === collaboration.id);
    const matchesSearch = `${collaboration.name} ${collaboration.postingType} ${invoice?.invoiceNumber ?? ""}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || (statusFilter === "Not invoiced" ? !invoice : invoice?.status === statusFilter);
    return matchesSearch && matchesStatus;
  });

  function openNew(collaboration: Collaboration) {
    const next = emptyInvoice(invoices.length);
    next.collaborationId = collaboration.id;
    next.clientName = collaboration.name;
    next.itemDescription = `${collaboration.postingType} content creation - ${collaboration.name}`;
    next.unitPrice = collaboration.payment;
    setDraft(next);
    setMessage("");
    dialog.current?.showModal();
  }

  function openExisting(invoice: Invoice) {
    setDraft(invoiceInput(invoice));
    setMessage("");
    dialog.current?.showModal();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    startTransition(async () => {
      const result = await saveInvoice(draft);
      if (result.error || !result.data) {
        setMessage(result.error ?? "Could not save the invoice.");
        return;
      }
      setInvoices((current) => draft.id
        ? current.map((invoice) => invoice.id === result.data?.id ? result.data : invoice)
        : [result.data!, ...current]);
      setDraft(invoiceInput(result.data));
      setMessage("");
      dialog.current?.close();
    });
  }

  function removeInvoice(invoice: Invoice) {
    if (!window.confirm(`Delete invoice ${invoice.invoiceNumber}?`)) return;
    startTransition(async () => {
      const result = await deleteInvoice(invoice.id);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setInvoices((current) => current.filter((item) => item.id !== invoice.id));
    });
  }

  const paidTotal = invoices.filter((invoice) => invoice.status === "Paid").reduce((sum, invoice) => {
    const beforeTax = invoice.quantity * invoice.unitPrice;
    return sum + beforeTax - beforeTax * invoice.discountRate / 100;
  }, 0);

  return (
    <div className="min-h-full flex-1 bg-[#F7F8FC] p-5 text-slate-800 sm:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="text-2xl font-bold tracking-tight text-slate-900">Invoices</h1><p className="mt-1.5 text-sm text-slate-500">Track client invoices and create a ready-to-send PDF.</p></div>
      </header>

      {initialError && <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"><strong>Database setup needed.</strong> {initialError}</div>}

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total invoices</p><p className="mt-2 text-2xl font-bold text-slate-900">{invoices.length}</p></div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Awaiting payment</p><p className="mt-2 text-2xl font-bold text-blue-600">{invoices.filter((item) => item.status === "Unpaid").length}</p></div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Paid</p><p className="mt-2 text-2xl font-bold text-emerald-600">{money.format(paidTotal)}</p></div>
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
          <div className="relative min-w-56 flex-1 sm:max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search client or invoice" className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-400" /></div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "All" | "Not invoiced" | InvoiceStatus)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"><option>All</option><option>Not invoiced</option><option>Unpaid</option><option>Paid</option></select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-3 font-semibold">Client</th><th className="px-5 py-3 font-semibold">Collaboration date</th><th className="px-5 py-3 font-semibold">Collaboration payment</th><th className="px-5 py-3 font-semibold">Invoice</th><th className="py-3 pl-20 pr-5 font-semibold">Status</th><th className="py-3 pr-14 text-right font-semibold">Action</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((collaboration) => {
                const invoice = invoices.find((item) => item.collaborationId === collaboration.id);
                return <tr key={collaboration.id} className="hover:bg-slate-50/60"><td className="px-5 py-4"><p className="font-semibold text-slate-800">{collaboration.name}</p><p className="mt-0.5 text-xs text-slate-400">{collaboration.postingType}</p></td><td className="px-5 py-4 text-slate-500">{new Date(collaboration.visitDate).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}</td><td className="px-5 py-4 font-semibold">{money.format(collaboration.payment)}</td><td className="px-5 py-4">{invoice ? <span className="font-semibold text-indigo-600">{invoice.invoiceNumber}</span> : <span className="text-slate-400">Not created</span>}</td><td className="py-4 pl-20 pr-5">{invoice ? <StatusBadge status={invoice.status} /> : <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">No invoice</span>}</td><td className="py-4 pl-5 pr-14"><div className="flex justify-end gap-1">{invoice ? <><button type="button" aria-label={`Edit ${invoice.invoiceNumber}`} onClick={() => openExisting(invoice)} className="rounded-lg p-2 text-slate-400 transition hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-slate-600"><Pencil size={16} /></button><button type="button" aria-label={`Delete ${invoice.invoiceNumber}`} onClick={() => removeInvoice(invoice)} className="rounded-lg p-2 text-slate-400 transition hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-slate-600"><Trash2 size={16} /></button></> : <button type="button" onClick={() => openNew(collaboration)} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"><FilePlus2 size={14} /> Create invoice</button>}</div></td></tr>;
              })}
            </tbody>
          </table>
        </div>
        {!filtered.length && <div className="px-6 py-14 text-center"><p className="text-sm font-semibold text-slate-600">No invoices found</p><p className="mt-1 text-sm text-slate-400">Create an invoice from one of your collaborations.</p></div>}
      </section>

      <dialog ref={dialog} className="fixed inset-0 m-auto max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] max-w-7xl overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-2xl backdrop:bg-slate-900/45">
        <div className="flex max-h-[calc(100dvh_-_2rem)] flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><h2 className="font-bold text-slate-900">{draft.id ? `Edit ${draft.invoiceNumber}` : "Create invoice"}</h2><p className="text-xs text-slate-400">Fill the details, preview, then save or export.</p></div><button type="button" aria-label="Close invoice editor" onClick={() => dialog.current?.close()} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={20} /></button></div>
          <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[380px_1fr] lg:overflow-hidden">
            <form onSubmit={submit} className="space-y-4 border-r border-slate-200 p-5 lg:overflow-y-auto">
              <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3"><p className="text-xs font-semibold uppercase tracking-wider text-indigo-500">Linked collaboration</p><p className="mt-1 text-sm font-semibold text-indigo-900">{collaborations.find((item) => item.id === draft.collaborationId)?.name ?? draft.clientName}</p></div>
              <div className="grid grid-cols-2 gap-3"><Field label="Invoice number" value={draft.invoiceNumber} onChange={(value) => setDraft({ ...draft, invoiceNumber: value })} required /><label className="block text-xs font-semibold text-slate-600">Status<select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as InvoiceStatus })} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm"><option>Unpaid</option><option>Paid</option></select></label></div>
              <Field label="Client name" value={draft.clientName} onChange={(value) => setDraft({ ...draft, clientName: value })} required />
              <label className="block text-xs font-semibold text-slate-600">Client address<textarea value={draft.clientAddress} onChange={(event) => setDraft({ ...draft, clientAddress: event.target.value })} rows={2} className="mt-1.5 w-full resize-none rounded-lg border border-slate-200 p-2.5 text-sm" /></label>
              <Field label="Issue date" type="date" value={draft.issueDate} onChange={(value) => setDraft({ ...draft, issueDate: value })} required />
              <Field label="Description" value={draft.itemDescription} onChange={(value) => setDraft({ ...draft, itemDescription: value })} required />
              <div className="grid grid-cols-3 gap-3"><NumberField label="Quantity" value={draft.quantity} onChange={(value) => setDraft({ ...draft, quantity: value })} min="0.01" step="0.01" /><NumberField label="Rate (RM)" value={draft.unitPrice} onChange={(value) => setDraft({ ...draft, unitPrice: value })} min="0" step="0.01" /><NumberField label="Discount %" value={draft.discountRate} onChange={(value) => setDraft({ ...draft, discountRate: value })} min="0" step="0.01" /></div>
              <div className="rounded-xl bg-slate-50 p-3 text-sm"><div className="flex justify-between"><span className="text-slate-500">Invoice total</span><strong>{money.format(total)}</strong></div></div>
              {message && <p role="status" className={`text-xs ${message === "Invoice saved." ? "text-emerald-600" : "text-rose-600"}`}>{message}</p>}
              <div className="flex gap-2"><button type="submit" disabled={pending} className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{pending ? "Saving…" : "Save invoice"}</button><button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"><Download size={16} /> PDF</button></div>
            </form>
            <div className="bg-slate-100 p-4 sm:p-8 lg:overflow-y-auto"><InvoiceTemplate invoice={draft} /></div>
          </div>
        </div>
      </dialog>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <label className="block text-xs font-semibold text-slate-600">{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none focus:border-indigo-400" /></label>;
}

function NumberField({ label, value, onChange, min, step }: { label: string; value: number; onChange: (value: number) => void; min: string; step: string }) {
  return <label className="block text-xs font-semibold text-slate-600">{label}<input type="number" value={value} min={min} step={step} onChange={(event) => onChange(Number(event.target.value))} required className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none focus:border-indigo-400" /></label>;
}
