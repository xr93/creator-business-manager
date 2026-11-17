"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { deleteCollaboration, saveCollaboration, type Collaboration } from "@/app/calendar/actions";

const money = new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" });

function localDateTime(value: string) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString();
}

function inputDate(value: string) {
  return localDateTime(value).slice(0, 10);
}

function inputTime(value: string) {
  return localDateTime(value).slice(11, 16);
}

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
}

function timeLabel(value: string) {
  return new Date(value).toLocaleTimeString("en-MY", { hour: "numeric", minute: "2-digit" });
}

function todayKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function CollaborationManager({ initialCollaborations, initialError }: {
  initialCollaborations: Collaboration[];
  initialError: string | null;
}) {
  const [collaborations, setCollaborations] = useState(initialCollaborations);
  const [editing, setEditing] = useState<Collaboration | null>(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState(initialError ?? "");
  const [pending, startTransition] = useTransition();
  const dialog = useRef<HTMLDialogElement>(null);
  const form = useRef<HTMLFormElement>(null);

  const filtered = collaborations.filter((item) => `${item.name} ${item.postingType} ${item.status}`.toLowerCase().includes(search.toLowerCase()));

  function openForm(collaboration: Collaboration | null = null) {
    setEditing(collaboration);
    setMessage("");
    form.current?.reset();
    dialog.current?.showModal();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const visitDate = String(data.get("visitDate"));
    const deadlineDate = String(data.get("deadlineDate") ?? "");
    const deadlineTime = String(data.get("deadlineTime") ?? "");
    if (Boolean(deadlineDate) !== Boolean(deadlineTime)) {
      setMessage("Enter both the content deadline date and time, or leave both blank.");
      return;
    }
    const input = {
      ...(editing ? { id: editing.id } : {}),
      name: String(data.get("name") ?? "").trim(),
      description: String(data.get("description") ?? "").trim(),
      postingType: data.get("postingType") === "Video" ? "Video" as const : "Photo" as const,
      status: data.get("status") === "Posted" ? "Posted" as const : "Scheduled" as const,
      visitDate: new Date(`${visitDate}T${String(data.get("visitStart"))}`).toISOString(),
      visitEnd: new Date(`${visitDate}T${String(data.get("visitEnd"))}`).toISOString(),
      deadline: deadlineDate && deadlineTime ? new Date(`${deadlineDate}T${deadlineTime}`).toISOString() : null,
      payment: Number(data.get("payment") ?? 0),
    };
    setMessage("");
    startTransition(async () => {
      const result = await saveCollaboration(input);
      if (result.error || !result.data) {
        setMessage(result.error ?? "Could not save the collaboration.");
        return;
      }
      setCollaborations((current) => editing
        ? current.map((item) => item.id === result.data?.id ? result.data : item)
        : [...current, result.data!].sort((a, b) => a.visitDate.localeCompare(b.visitDate)));
      dialog.current?.close();
    });
  }

  function remove(collaboration: Collaboration) {
    if (!window.confirm(`Delete ${collaboration.name}?`)) return;
    startTransition(async () => {
      const result = await deleteCollaboration(collaboration.id);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setCollaborations((current) => current.filter((item) => item.id !== collaboration.id));
    });
  }

  return (
    <div className="min-h-full flex-1 bg-[#F7F8FC] p-5 text-slate-800 sm:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="text-2xl font-bold tracking-tight text-slate-900">Collaborations</h1><p className="mt-1.5 text-sm text-slate-500">The table and calendar share the same collaboration records.</p></div>
        <button type="button" onClick={() => openForm()} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"><Plus size={17} /> New collaboration</button>
      </header>

      {initialError && <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{initialError}</div>}

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4"><div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search client or posting type" className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-400" /></div></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-3 font-semibold">Client</th><th className="px-5 py-3 font-semibold">Description</th><th className="px-5 py-3 font-semibold">Visit date</th><th className="px-5 py-3 font-semibold">Visit time</th><th className="px-5 py-3 font-semibold">Payment</th><th className="px-5 py-3 font-semibold">Posting type</th><th className="px-5 py-3 font-semibold">Content deadline</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 text-right font-semibold">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => <tr key={item.id} className="hover:bg-slate-50/60"><td className="px-5 py-4 font-semibold text-slate-800">{item.name}</td><td className="max-w-56 px-5 py-4 text-slate-500"><p className="truncate" title={item.description}>{item.description || "—"}</p></td><td className="px-5 py-4 text-slate-500">{dateLabel(item.visitDate)}</td><td className="px-5 py-4 font-medium text-slate-700">{timeLabel(item.visitDate)}–{timeLabel(item.visitEnd)}</td><td className="px-5 py-4 font-semibold">{money.format(item.payment)}</td><td className="px-5 py-4"><span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">{item.postingType}</span></td><td className="px-5 py-4 text-slate-500">{item.deadline ? <><p>{dateLabel(item.deadline)}</p><p className="text-xs">{timeLabel(item.deadline)}</p></> : <span className="text-slate-400">Not set</span>}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === "Posted" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{item.status}</span></td><td className="px-5 py-4"><div className="flex justify-end gap-1"><button type="button" aria-label={`Edit ${item.name}`} onClick={() => openForm(item)} className="rounded-lg p-2 text-slate-400 transition hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-slate-600"><Pencil size={16} /></button><button type="button" aria-label={`Delete ${item.name}`} onClick={() => remove(item)} className="rounded-lg p-2 text-slate-400 transition hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-slate-600"><Trash2 size={16} /></button></div></td></tr>)}
            </tbody>
          </table>
        </div>
        {!filtered.length && <div className="px-6 py-14 text-center text-sm text-slate-400">No collaborations found.</div>}
      </section>
      {message && <p className="mt-3 text-sm text-rose-600">{message}</p>}

      <dialog ref={dialog} className="fixed inset-0 m-auto max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] max-w-xl overflow-y-auto rounded-2xl border-0 bg-white p-6 shadow-2xl backdrop:bg-slate-900/40">
        <div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-bold text-slate-900">{editing ? "Edit collaboration" : "New collaboration"}</h2><p className="mt-1 text-xs text-slate-400">This will also appear in Calendar and Invoices.</p></div><button type="button" aria-label="Close form" onClick={() => dialog.current?.close()} className="rounded-lg p-2 text-slate-400 hover:bg-slate-50"><X size={20} /></button></div>
        <form key={editing?.id ?? "new"} ref={form} onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-medium">Client / collaboration name<input name="name" required maxLength={120} defaultValue={editing?.name ?? ""} className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 outline-indigo-600" /></label>
          <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium">Posting type<select name="postingType" defaultValue={editing?.postingType ?? "Photo"} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white p-2.5"><option>Photo</option><option>Video</option></select></label><label className="block text-sm font-medium">Status<select name="status" defaultValue={editing?.status ?? "Scheduled"} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white p-2.5"><option>Scheduled</option><option>Posted</option></select></label></div>
          <label className="block text-sm font-medium">Visit date<input name="visitDate" type="date" required defaultValue={editing ? inputDate(editing.visitDate) : todayKey()} className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5" /></label>
          <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium">Visit start<input name="visitStart" type="time" required defaultValue={editing ? inputTime(editing.visitDate) : "14:00"} className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5" /></label><label className="block text-sm font-medium">Visit end<input name="visitEnd" type="time" required defaultValue={editing ? inputTime(editing.visitEnd) : "17:00"} className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5" /></label></div>
          <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium">Content deadline <span className="font-normal text-slate-400">(optional)</span><input name="deadlineDate" type="date" defaultValue={editing?.deadline ? inputDate(editing.deadline) : ""} className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5" /></label><label className="block text-sm font-medium">Deadline time <span className="font-normal text-slate-400">(optional)</span><input name="deadlineTime" type="time" defaultValue={editing?.deadline ? inputTime(editing.deadline) : ""} className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5" /></label></div>
          <label className="block text-sm font-medium">Payment (RM)<input name="payment" type="number" min="0" step="0.01" required defaultValue={editing?.payment ?? 0} className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5" /></label>
          {message && <p role="alert" className="text-xs text-rose-600">{message}</p>}
          <label className="block text-sm font-medium">Description / comments <span className="font-normal text-slate-400">(optional)</span><textarea name="description" maxLength={1000} rows={3} defaultValue={editing?.description ?? ""} placeholder="Add campaign details, deliverables, or reminders" className="mt-1.5 w-full resize-y rounded-lg border border-slate-200 p-2.5 outline-indigo-600" /></label>
          <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => dialog.current?.close()} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm">Cancel</button><button type="submit" disabled={pending} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{pending ? "Saving…" : editing ? "Save changes" : "Add collaboration"}</button></div>
        </form>
      </dialog>
    </div>
  );
}
