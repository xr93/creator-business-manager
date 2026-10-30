"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { Banknote, CalendarDays, ChevronLeft, ChevronRight, Clock3, Plus, Trash2, X } from "lucide-react";
import { deleteCollaboration, getCollaborations, saveCollaboration, type Collaboration } from "./actions";
const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function localDateTime(value: string) {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString();
}

function inputDate(value: string) {
  return localDateTime(value).slice(0, 10);
}

function inputTime(value: string) {
  return localDateTime(value).slice(11, 16);
}

function eventTime(value: string) {
  return new Date(value).toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" });
}

function eventDateTime(value: string) {
  return new Date(value).toLocaleString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CalendarPage() {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [events, setEvents] = useState<Collaboration[]>([]);
  const [editing, setEditing] = useState<Collaboration | null>(null);
  const [viewing, setViewing] = useState<{ event: Collaboration; kind: "visit" | "deadline" } | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()));
  const [message, setMessage] = useState("Loading collaborations…");
  const [pending, startTransition] = useTransition();
  const dialog = useRef<HTMLDialogElement>(null);
  const detailDialog = useRef<HTMLDialogElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const firstWeekday = (month.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
  const days = Array.from({ length: cellCount }, (_, index) =>
    new Date(month.getFullYear(), month.getMonth(), index - firstWeekday + 1),
  );
  const monthLabel = month.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  useEffect(() => {
    let active = true;
    getCollaborations().then((result) => {
      if (!active) return;
      setEvents(result.data);
      setMessage(result.error ?? (result.data.length ? "" : "No collaborations yet. Add your first one."));
    });
    return () => { active = false; };
  }, []);

  function openEvent(date: string, event: Collaboration | null = null) {
    setSelectedDate(date);
    setEditing(event);
    form.current?.reset();
    dialog.current?.showModal();
  }

  function openDetails(event: Collaboration, kind: "visit" | "deadline") {
    setViewing({ event, kind });
    detailDialog.current?.showModal();
    detailDialog.current?.focus();
  }

  function editViewedEvent() {
    if (!viewing) return;
    detailDialog.current?.close();
    openEvent(dateKey(new Date(viewing.event.visitDate)), viewing.event);
  }

  function removeViewedEvent() {
    if (!viewing || !window.confirm(`Delete ${viewing.event.name}?`)) return;
    const id = viewing.event.id;
    setMessage("");
    startTransition(async () => {
      const result = await deleteCollaboration(id);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setEvents((current) => current.filter((item) => item.id !== id));
      detailDialog.current?.close();
      setViewing(null);
    });
  }

  function saveEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const input = {
      ...(editing ? { id: editing.id } : {}),
      name: String(data.get("name") ?? "").trim(),
      postingType: data.get("postingType") === "Video" ? "Video" as const : "Photo" as const,
      status: data.get("status") === "Posted" ? "Posted" as const : "Scheduled" as const,
      visitDate: new Date(`${String(data.get("visitDate"))}T${String(data.get("visitTime"))}`).toISOString(),
      deadline: new Date(`${String(data.get("deadlineDate"))}T${String(data.get("deadlineTime"))}`).toISOString(),
      payment: Number(data.get("payment") ?? 0),
    };
    setMessage("");
    startTransition(async () => {
      const result = await saveCollaboration(input);
      if (result.error || !result.data) {
        setMessage(result.error ?? "Could not save the collaboration.");
        return;
      }
      setEvents((current) => editing
        ? current.map((item) => item.id === result.data?.id ? result.data : item)
        : [...current, result.data!]);
      setMessage("");
      dialog.current?.close();
    });
  }

  return (
    <div className="min-h-full flex-1 bg-[#F7F8FC] p-6 text-slate-800 md:p-8" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <header className="mb-7 flex flex-wrap items-center justify-between gap-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Calendar</h1>
          <p className="mt-2 text-sm text-slate-400 sm:text-base">Your 探店 visits, shoots and posting deadlines</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            className="flex size-11 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-indigo-600">
            <ChevronLeft size={20} />
          </button>
          <h2 aria-live="polite" className="min-w-36 text-center text-base font-medium sm:min-w-40">{monthLabel}</h2>
          <button type="button" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            className="flex size-11 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-indigo-600">
            <ChevronRight size={20} />
          </button>
          <button type="button" onClick={() => openEvent(dateKey(month))}
            className="ml-1 inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 font-medium text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
            <Plus size={20} /> New
          </button>
        </div>
      </header>

      <section aria-label={`${monthLabel} collaboration calendar`} className="mx-auto max-w-6xl overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3 text-sm text-slate-400">
          <div className="flex items-center gap-5">
            <span className="inline-flex items-center gap-2"><span className="size-2.5 rounded-full bg-indigo-400" />Visit / event</span>
            <span className="inline-flex items-center gap-2"><span className="size-2.5 rounded-full bg-rose-400" />Posting deadline</span>
            <span className="inline-flex items-center gap-2"><span className="size-2.5 rounded-full bg-slate-400" />Posted</span>
          </div>
          <span>Click an empty day to add a collaboration</span>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
              {weekdays.map((day) => <div key={day} className="px-4 py-3 text-sm text-slate-500">{day}</div>)}
            </div>
            <div className="grid grid-cols-7">
              {days.map((day, index) => {
                const key = dateKey(day);
                const outside = day.getMonth() !== month.getMonth();
                const dayEvents = events.flatMap((event) => [
                  ...(dateKey(new Date(event.visitDate)) === key ? [{ event, kind: "visit" as const }] : []),
                  ...(dateKey(new Date(event.deadline)) === key ? [{ event, kind: "deadline" as const }] : []),
                ]);
                const fullDate = day.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
                return (
                  <div key={key} className={`relative min-h-[100px] border-slate-100 p-2.5 xl:min-h-[120px] ${index % 7 !== 6 ? "border-r" : ""} ${index < cellCount - 7 ? "border-b" : ""} ${outside ? "bg-slate-50/60 text-slate-400" : "bg-white"}`}>
                    <button type="button" aria-label={`Add collaboration on ${fullDate}`} onClick={() => openEvent(key)}
                      className="absolute inset-0 transition hover:bg-slate-50/50 focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600" />
                    <span className="pointer-events-none relative mb-2 flex size-8 items-center justify-center text-sm">{day.getDate()}</span>
                    <div className="relative flex flex-col gap-1.5 pointer-events-none">
                      {dayEvents.map(({ event, kind }) => (
                        <button type="button" key={`${event.id}-${kind}`} title={`${event.name} · ${event.postingType} · ${event.status} · ${eventTime(kind === "visit" ? event.visitDate : event.deadline)}`} onClick={() => openDetails(event, kind)}
                          aria-label={`${event.status === "Posted" ? "Posted" : kind === "visit" ? "Visit" : "Posting deadline"}: ${event.name}, ${fullDate}. View details`}
                          className={`pointer-events-auto flex w-full items-center gap-1.5 truncate rounded-lg px-2 py-1 text-left text-[9px] font-semibold transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-indigo-600 ${event.status === "Posted" ? "bg-slate-100 text-slate-600" : kind === "visit" ? "bg-[#E3E8FF] text-indigo-700" : "bg-[#FFE1E5] text-rose-700"}`}>
                          <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${event.status === "Posted" ? "bg-slate-400" : kind === "visit" ? "bg-indigo-400" : "bg-rose-400"}`} />
                          <span className="truncate">{event.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
      {message && <p role="status" className="mt-3 text-xs text-slate-500">{message}</p>}

      <dialog ref={detailDialog} tabIndex={-1} aria-labelledby="collaboration-detail-title" className="fixed inset-0 m-auto max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] max-w-lg overflow-y-auto rounded-3xl border-0 border-t-8 border-t-indigo-500 bg-white p-0 text-slate-800 shadow-2xl outline-none backdrop:bg-slate-900/40">
        {viewing && (
          <div className="p-7">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h2 id="collaboration-detail-title" className="break-words text-2xl font-bold leading-tight text-slate-900">{viewing.event.name}</h2>
                <p className="mt-1 text-base text-slate-500">{viewing.event.postingType} collaboration</p>
              </div>
              <button type="button" aria-label="Close details" onClick={() => detailDialog.current?.close()} className="shrink-0 rounded-lg p-2 text-slate-400 outline-none transition hover:bg-slate-50 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-indigo-500"><X size={22} /></button>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${viewing.kind === "visit" ? "bg-[#E3E8FF] text-indigo-700" : "bg-[#FFE1E5] text-rose-700"}`}>
                <span className={`size-2 rounded-full ${viewing.kind === "visit" ? "bg-indigo-400" : "bg-rose-400"}`} />
                {viewing.kind === "visit" ? "Visit" : "Content deadline"}
              </span>
              <span className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600">{viewing.event.status}</span>
              <span className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600">{viewing.event.postingType}</span>
            </div>

            <div className="mt-7 space-y-4 text-sm sm:text-base">
              <div className="flex items-center gap-3"><CalendarDays className="shrink-0 text-indigo-500" size={21} /><span className="text-slate-500">Visit:</span><strong className="font-semibold text-slate-800">{eventDateTime(viewing.event.visitDate)}</strong></div>
              <div className="flex items-center gap-3"><Clock3 className="shrink-0 text-rose-500" size={21} /><span className="text-slate-500">Deadline:</span><strong className="font-semibold text-slate-800">{eventDateTime(viewing.event.deadline)}</strong></div>
              <div className="flex items-center gap-3"><Banknote className="shrink-0 text-emerald-500" size={21} /><span className="text-slate-500">Fee:</span><strong className="font-semibold text-slate-800">RM {viewing.event.payment.toLocaleString("en-MY")}</strong></div>
            </div>

            <div className="mt-8 flex items-center gap-3">
              <button type="button" onClick={editViewedEvent} className="flex-1 rounded-xl bg-indigo-600 px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-indigo-700">Edit</button>
              <button type="button" disabled={pending} aria-label="Delete collaboration" onClick={removeViewedEvent} className="rounded-xl p-3 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"><Trash2 size={22} /></button>
            </div>
          </div>
        )}
      </dialog>

      <dialog ref={dialog} aria-labelledby="event-title" className="fixed inset-0 m-auto max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 text-slate-800 shadow-xl backdrop:bg-slate-900/35">
        <div className="mb-5 flex items-center justify-between">
          <h2 id="event-title" className="text-xl font-semibold">{editing ? "Edit collaboration" : "New collaboration"}</h2>
          <button type="button" aria-label="Close form" onClick={() => dialog.current?.close()} className="rounded-lg p-2 hover:bg-slate-50"><X size={20} /></button>
        </div>
        <form key={`${selectedDate}-${editing?.id ?? "new"}`} ref={form} onSubmit={saveEvent} className="space-y-4">
          <label className="block text-sm font-medium">Campaign / Job name
            <input name="name" required maxLength={120} defaultValue={editing?.name ?? ""} placeholder="e.g. Weekend brunch review" className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 outline-indigo-600" />
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">Posting type
              <select name="postingType" defaultValue={editing?.postingType ?? "Photo"} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white p-2.5 outline-indigo-600">
                <option value="Photo">Photo</option>
                <option value="Video">Video</option>
              </select>
            </label>
            <label className="block text-sm font-medium">Status
              <select name="status" defaultValue={editing?.status ?? "Scheduled"} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white p-2.5 outline-indigo-600">
                <option value="Scheduled">Scheduled</option>
                <option value="Posted">Posted</option>
              </select>
            </label>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">Visit date
              <input name="visitDate" type="date" required defaultValue={editing ? inputDate(editing.visitDate) : selectedDate} className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 outline-indigo-600" />
            </label>
            <label className="block text-sm font-medium">Visit time
              <input name="visitTime" type="time" required defaultValue={editing ? inputTime(editing.visitDate) : "09:00"} className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 outline-indigo-600" />
            </label>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">Content deadline
              <input name="deadlineDate" type="date" required defaultValue={editing ? inputDate(editing.deadline) : selectedDate} className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 outline-indigo-600" />
            </label>
            <label className="block text-sm font-medium">Deadline time
              <input name="deadlineTime" type="time" required defaultValue={editing ? inputTime(editing.deadline) : "18:00"} className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 outline-indigo-600" />
            </label>
          </div>
          <label className="block text-sm font-medium">Payment (RM)
            <input name="payment" type="number" required defaultValue={editing?.payment ?? 0} className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 outline-indigo-600" />
          </label>
          {message && <p role="alert" className="text-xs text-rose-600">{message}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => dialog.current?.close()} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">Cancel</button>
            <button type="submit" disabled={pending} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">{pending ? "Saving…" : editing ? "Save changes" : "Add collaboration"}</button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
