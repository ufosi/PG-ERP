"use client";

import { useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { AlertTriangle, CalendarDays, CheckCircle2, ChevronDown, ChevronUp, ClipboardList, Clock, Pencil, Plus, RotateCcw, Save, Square, Trash2, User, X } from "lucide-react";
import { createProductionOrder, deleteProductionOrder, deleteWorkLog, forceStopWorkLog, setOrderStatus, stopWorkLog, updateOrderAssignees, updateProductionOrder, updateWorkLog } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDate, formatDateTime, formatDuration } from "@/lib/time";
import type { UserRole } from "@/types/roles";

type WorkLogEntry = {
  id: string;
  startedAt: Date;
  endedAt: Date | null;
  note: string | null;
  user: { id: string; name: string };
};

type Worker = { id: string; name: string; role: string };
type Category = { id: string; name: string };
type ServiceOption = { id: string; name: string };
type CustomerSuggestion = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  taxId: string | null;
  street: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  notes: string | null;
};

type Order = {
  id: string;
  number: string;
  name: string;
  customer: string | null;
  customerRef: { id: string; name: string; phone: string | null; email: string | null } | null;
  description: string | null;
  category: Category | null;
  color: string | null;
  photos: string | null;
  price: number | null;
  materialCost: number | null;
  projectDetails: string | null;
  productionComments: string | null;
  officeComments: string | null;
  status: string;
  workerCanComplete: boolean;
  dueDate: Date | null;
  receivedDate: Date | null;
  createdAt: Date;
  createdBy: { name: string };
  closedAt: Date | null;
  closedBy: { name: string } | null;
  assignees: { id: string; name: string }[];
  serviceOptions: ServiceOption[];
  workLogs: WorkLogEntry[];
};

type Props = {
  orders: Order[];
  workers: Worker[];
  userId: string;
  role: UserRole;
  activeLogId: string | null;
  activeLogOrderId: string | null;
  categories: Category[];
  serviceOptions: ServiceOption[];
};

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  OPEN: { label: "Otwarte", cls: "bg-sky-500/15 text-sky-300 ring-sky-500/30" },
  IN_PROGRESS: { label: "W toku", cls: "bg-amber-500/15 text-amber-300 ring-amber-500/30" },
  DONE: { label: "Zakończone", cls: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30" },
  CANCELLED: { label: "Anulowane", cls: "bg-red-500/15 text-red-300 ring-red-500/30" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABELS[status] ?? { label: status, cls: "bg-slate-700 text-slate-300 ring-slate-600" };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${s.cls}`}>
      {s.label}
    </span>
  );
}

function TotalTime({ logs }: { logs: WorkLogEntry[] }) {
  const totalMs = logs.reduce((sum, l) => {
    const end = l.endedAt ? new Date(l.endedAt) : new Date();
    return sum + (end.getTime() - new Date(l.startedAt).getTime());
  }, 0);
  const totalMin = Math.floor(totalMs / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return <span>{h}h {String(m).padStart(2, "0")}m</span>;
}

const LONG_LOG_MS = 12 * 60 * 60 * 1000;

function isLongRunning(log: WorkLogEntry): boolean {
  if (log.endedAt) return false;
  return Date.now() - new Date(log.startedAt).getTime() > LONG_LOG_MS;
}

function toDatetimeLocalValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function WorkLogRow({
  log,
  canManage,
  onError,
}: {
  log: WorkLogEntry;
  canManage: boolean;
  onError: (msg: string | undefined) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const long = isLongRunning(log);

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onError(undefined);
    const fd = new FormData(e.currentTarget);
    fd.set("workLogId", log.id);
    startTransition(async () => {
      try {
        await updateWorkLog(fd);
        setEditing(false);
      } catch (err) {
        onError(err instanceof Error ? err.message : "Nie udało się zapisać odbicia.");
      }
    });
  }

  function handleForceStop() {
    if (!confirm(`Zamknąć trwające odbicie pracownika ${log.user.name}?\nKoniec zostanie ustawiony na teraz.`)) {
      return;
    }
    onError(undefined);
    const fd = new FormData();
    fd.set("workLogId", log.id);
    startTransition(async () => {
      try {
        await forceStopWorkLog(fd);
      } catch (err) {
        onError(err instanceof Error ? err.message : "Nie udało się zamknąć odbicia.");
      }
    });
  }

  function handleDelete() {
    if (!confirm(`Usunąć odbicie pracownika ${log.user.name}?\nOperacja nieodwracalna.`)) {
      return;
    }
    onError(undefined);
    const fd = new FormData();
    fd.set("workLogId", log.id);
    startTransition(async () => {
      try {
        await deleteWorkLog(fd);
      } catch (err) {
        onError(err instanceof Error ? err.message : "Nie udało się usunąć odbicia.");
      }
    });
  }

  if (editing) {
    return (
      <form onSubmit={handleSave} className="space-y-2 rounded-lg border border-emerald-800/40 bg-slate-900 p-3">
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-slate-500" />
          <span className="font-medium">{log.user.name}</span>
          <span className="text-xs text-slate-500">— edycja odbicia</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Start</label>
            <input
              type="datetime-local"
              name="startedAt"
              required
              defaultValue={toDatetimeLocalValue(new Date(log.startedAt))}
              className="h-9 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Koniec (puste = trwa)</label>
            <input
              type="datetime-local"
              name="endedAt"
              defaultValue={log.endedAt ? toDatetimeLocalValue(new Date(log.endedAt)) : ""}
              className="h-9 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs text-slate-400">Notatka</label>
            <input
              name="note"
              defaultValue={log.note ?? ""}
              maxLength={500}
              placeholder="np. korekta po pomyłce"
              className="h-9 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={pending} className="gap-1 bg-emerald-600 hover:bg-emerald-500">
            <Save className="h-3.5 w-3.5" />
            Zapisz
          </Button>
          <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => { setEditing(false); onError(undefined); }}>
            <X className="h-3.5 w-3.5" />
            Anuluj
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className={`flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm ${long ? "bg-amber-500/10 ring-1 ring-amber-500/30" : "bg-slate-900"}`}>
      <div className="flex items-center gap-2">
        {long && <AlertTriangle className="h-4 w-4 text-amber-400" />}
        <User className="h-4 w-4 text-slate-500" />
        <span className="font-medium">{log.user.name}</span>
        {log.note && (
          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-300" title={log.note}>
            {log.note.length > 30 ? log.note.slice(0, 30) + "…" : log.note}
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
        <span>{formatDateTime(new Date(log.startedAt))}</span>
        <span>→</span>
        <span>
          {log.endedAt ? (
            formatDateTime(new Date(log.endedAt))
          ) : (
            <span className={long ? "text-amber-400" : "text-emerald-400"}>trwa…</span>
          )}
        </span>
        <span className="font-mono text-slate-300">
          {formatDuration(new Date(log.startedAt), log.endedAt ? new Date(log.endedAt) : null)}
        </span>
        {canManage && (
          <div className="flex items-center gap-1">
            {!log.endedAt && (
              <button
                onClick={handleForceStop}
                disabled={pending}
                title="Zamknij trwające odbicie"
                className="rounded p-1 text-amber-400 hover:bg-slate-800 hover:text-amber-300"
              >
                <Square className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={() => { setEditing(true); onError(undefined); }}
              disabled={pending}
              title="Edytuj"
              className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleDelete}
              disabled={pending}
              title="Usuń odbicie"
              className="rounded p-1 text-red-400 hover:bg-slate-800 hover:text-red-300"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function OrderCard({
  order,
  workers,
  userId,
  role,
  activeLogId,
  activeLogOrderId,
  categories,
  serviceOptions,
  highlighted,
}: {
  order: Order;
  workers: Worker[];
  userId: string;
  role: UserRole;
  activeLogId: string | null;
  activeLogOrderId: string | null;
  categories: Category[];
  serviceOptions: ServiceOption[];
  highlighted?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editingAssignees, setEditingAssignees] = useState(false);
  const [editingOrder, setEditingOrder] = useState(false);
  const [stoppingNote, setStoppingNote] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>();
  const [pending, startTransition] = useTransition();
  const canManage = role === "ADMIN" || role === "BIURO";
  const isActiveHere = activeLogOrderId === order.id;
  const myOpenLog = order.workLogs.find((l) => l.user.id === userId && !l.endedAt);
  const hasLongRunning = order.workLogs.some(isLongRunning);

  function handleSaveAssignees(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("orderId", order.id);
    startTransition(async () => {
      await updateOrderAssignees(fd);
      setEditingAssignees(false);
    });
  }

  function handleSaveOrder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(undefined);
    const fd = new FormData(e.currentTarget);
    fd.set("orderId", order.id);
    startTransition(async () => {
      try {
        await updateProductionOrder(fd);
        setEditingOrder(false);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Nie udało się zapisać.");
      }
    });
  }

  function handleDelete() {
    if (!confirm(`Usunąć zlecenie #${order.number} "${order.name}"?\nUsunie również wszystkie odbicia powiązane z tym zleceniem.`)) {
      return;
    }
    setErrorMsg(undefined);
    const fd = new FormData();
    fd.set("orderId", order.id);
    startTransition(async () => {
      try {
        await deleteProductionOrder(fd);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Nie udało się usunąć.");
      }
    });
  }

  function handleStop(note?: string) {
    if (!myOpenLog) return;
    const fd = new FormData();
    fd.set("workLogId", myOpenLog.id);
    if (note) fd.set("note", note);
    startTransition(() => {
      stopWorkLog(fd);
      setStoppingNote(false);
    });
  }

  function handleStopWithNote(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const note = String(fd.get("note") ?? "").trim();
    handleStop(note || undefined);
  }

  function handleStatus(status: string) {
    const fd = new FormData();
    fd.set("orderId", order.id);
    fd.set("status", status);
    startTransition(() => setOrderStatus(fd));
  }

  return (
    <Card id={`order-${order.id}`} className={`border-slate-800 bg-slate-900/70 ${highlighted ? "ring-2 ring-emerald-400 shadow-lg shadow-emerald-950/40" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm text-slate-400">#{order.number}</span>
              <StatusBadge status={order.status} />
              {hasLongRunning && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-300 ring-1 ring-amber-500/30" title="Trwające odbicie dłuższe niż 12h">
                  <AlertTriangle className="h-3 w-3" />
                  Długie odbicie
                </span>
              )}
            </div>
            <CardTitle className="mt-1 text-lg leading-snug">{order.name}</CardTitle>
            {order.category && (
              <div className="mt-2 inline-flex rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-300 ring-1 ring-slate-700">
                {order.category.name}
              </div>
            )}
            {order.serviceOptions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {order.serviceOptions.map((option) => (
                  <span key={option.id} className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-300 ring-1 ring-emerald-500/30">
                    {option.name}
                  </span>
                ))}
              </div>
            )}
            {order.customer && (
              <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-400">
                <User className="h-3.5 w-3.5" />
                {order.customer}
              </div>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <CalendarDays className="h-3.5 w-3.5" />
              Termin realizacji: {formatDate(order.dueDate ? new Date(order.dueDate) : null)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <CalendarDays className="h-3.5 w-3.5" />
              Przyjęto: {formatDate(order.receivedDate ? new Date(order.receivedDate) : null)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Clock className="h-3.5 w-3.5" />
              Suma: <TotalTime logs={order.workLogs} />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {errorMsg && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
            {errorMsg}
          </div>
        )}

        {(order.status === "DONE" || order.status === "CANCELLED") && order.closedAt && (
          <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${order.status === "DONE" ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-200" : "border-slate-700 bg-slate-950 text-slate-300"}`}>
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>
              {order.status === "DONE" ? "Zakończono" : "Anulowano"} {formatDateTime(new Date(order.closedAt))}
              {order.closedBy ? <> przez <span className="font-medium">{order.closedBy.name}</span></> : null}
            </span>
          </div>
        )}

        {editingOrder && canManage ? (
          <form onSubmit={handleSaveOrder} className="space-y-3 rounded-xl border border-emerald-800/40 bg-slate-950 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs text-slate-400">Numer zlecenia</label>
                <div className="text-sm font-mono text-slate-300">{order.number}</div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Nazwa *</label>
                <Input name="name" defaultValue={order.name} required className="bg-slate-900" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Klient</label>
                <Input name="customer" defaultValue={order.customer ?? ""} className="bg-slate-900" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Kolor</label>
                <Input name="color" defaultValue={order.color ?? ""} placeholder="np. RAL 9005" className="bg-slate-900" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Kategoria</label>
                <select
                  name="categoryId"
                  defaultValue={order.category?.id ?? ""}
                  className="h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Bez kategorii</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Termin realizacji</label>
                <Input
                  type="date"
                  name="dueDate"
                  defaultValue={order.dueDate ? new Date(order.dueDate).toISOString().slice(0, 10) : ""}
                  className="bg-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Data przyjęcia</label>
                <Input
                  type="date"
                  name="receivedDate"
                  defaultValue={order.receivedDate ? new Date(order.receivedDate).toISOString().slice(0, 10) : ""}
                  className="bg-slate-900"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs text-slate-400">Operacje technologiczne</label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {serviceOptions.map((option) => (
                    <label key={option.id} className="flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        name="serviceOptionIds"
                        value={option.id}
                        defaultChecked={order.serviceOptions.some((selected) => selected.id === option.id)}
                        className="h-4 w-4 rounded border-slate-700 bg-slate-950"
                      />
                      {option.name}
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Cena</label>
                <Input name="price" type="number" step="0.01" defaultValue={order.price ?? ""} className="bg-slate-900" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Koszt materiału</label>
                <Input name="materialCost" type="number" step="0.01" defaultValue={order.materialCost ?? ""} className="bg-slate-900" />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs text-slate-400">Opis</label>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={order.description ?? ""}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs text-slate-400">Uwagi na produkcję</label>
                <textarea
                  name="productionComments"
                  rows={2}
                  defaultValue={order.productionComments ?? ""}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs text-slate-400">Uwagi na biuro</label>
                <textarea
                  name="officeComments"
                  rows={2}
                  defaultValue={order.officeComments ?? ""}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="flex items-start gap-3 rounded-md border border-slate-800 bg-slate-900 px-3 py-2.5 text-sm cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    name="workerCanComplete"
                    defaultChecked={order.workerCanComplete}
                    className="mt-0.5 h-4 w-4 rounded border-slate-700"
                  />
                  <div>
                    <div className="font-medium text-slate-200">Pracownik może oznaczyć jako zakończone</div>
                    <div className="text-xs text-slate-500">
                      Włącz dla krótkich, jednorazowych zleceń. Wyłącz dla długich i ogólnych prac gospodarczych.
                    </div>
                  </div>
                </label>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={pending} className="bg-emerald-600 hover:bg-emerald-500">
                {pending ? "Zapisywanie…" : "Zapisz zmiany"}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => { setEditingOrder(false); setErrorMsg(undefined); }} disabled={pending}>
                Anuluj
              </Button>
            </div>
          </form>
        ) : (
          <>
            {order.description && (
              <p className="text-sm text-slate-400">{order.description}</p>
            )}
            {order.productionComments && (
              <div className="mt-2 rounded-lg border border-emerald-800/40 bg-emerald-950/30 p-3">
                <div className="text-xs font-medium text-emerald-300">Uwagi na produkcję</div>
                <p className="mt-1 text-sm text-slate-300">{order.productionComments}</p>
              </div>
            )}
            {(role === "ADMIN" || role === "BIURO") && order.officeComments && (
              <div className="mt-2 rounded-lg border border-blue-800/40 bg-blue-950/30 p-3">
                <div className="text-xs font-medium text-blue-300">Uwagi na biuro</div>
                <p className="mt-1 text-sm text-slate-300">{order.officeComments}</p>
              </div>
            )}
          </>
        )}

        {canManage && (
        <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs uppercase tracking-wider text-slate-500">Przypisani pracownicy</div>
            {!editingAssignees && (
              <button
                onClick={() => setEditingAssignees(true)}
                className="text-xs text-emerald-400 hover:text-emerald-300"
              >
                Edytuj
              </button>
            )}
          </div>
          {editingAssignees ? (
            <form onSubmit={handleSaveAssignees} className="mt-2 space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                {workers.map((w) => (
                  <label key={w.id} className="flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      name="assigneeIds"
                      value={w.id}
                      defaultChecked={order.assignees.some((a) => a.id === w.id)}
                      className="h-4 w-4 rounded border-slate-700 bg-slate-950"
                    />
                    <span className="flex-1">{w.name}</span>
                    <span className="text-xs text-slate-500">{w.role}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={pending} className="bg-emerald-600 hover:bg-emerald-500">
                  Zapisz
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setEditingAssignees(false)} disabled={pending}>
                  Anuluj
                </Button>
              </div>
            </form>
          ) : (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {order.assignees.length === 0 ? (
                <span className="text-xs italic text-slate-500">Brak przypisanych — żaden pracownik nie zobaczy tego zlecenia.</span>
              ) : (
                order.assignees.map((a) => (
                  <span key={a.id} className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-200 ring-1 ring-slate-700">
                    <User className="h-3 w-3" />
                    {a.name}
                  </span>
                ))
              )}
            </div>
          )}
        </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {order.status !== "DONE" && order.status !== "CANCELLED" && isActiveHere && (
              stoppingNote ? (
                <form onSubmit={handleStopWithNote} className="flex flex-wrap items-center gap-2">
                  <input
                    name="note"
                    autoFocus
                    maxLength={500}
                    placeholder="Notatka (opcjonalnie, np. wykonano 20szt)"
                    className="h-9 w-full min-w-0 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:w-72"
                  />
                  {order.workerCanComplete && (
                    <label className="flex items-center gap-2 text-sm text-slate-200">
                      <input type="checkbox" name="completeOrder" className="h-4 w-4 rounded border-slate-700 bg-slate-950" />
                      Zakończ całe zlecenie
                    </label>
                  )}
                  <Button type="submit" size="sm" variant="destructive" disabled={pending} className="gap-2">
                    <Square className="h-4 w-4" />
                    Zakończ
                  </Button>
                  <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => setStoppingNote(false)}>
                    Anuluj
                  </Button>
                </form>
              ) : (
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={pending}
                  onClick={() => setStoppingNote(true)}
                  className="gap-2"
                >
                  <Square className="h-4 w-4" />
                  Zakończ pracę
                </Button>
              )
          )}
          {canManage && (
            <>
              {order.status === "OPEN" && (
                <Button size="sm" variant="outline" disabled={pending} onClick={() => handleStatus("IN_PROGRESS")}>
                  Ustaw: W toku
                </Button>
              )}
              {order.status === "IN_PROGRESS" && (
                <Button size="sm" variant="outline" disabled={pending} onClick={() => handleStatus("DONE")}>
                  Ustaw: Zakończone
                </Button>
              )}
              {order.status !== "CANCELLED" && order.status !== "DONE" && (
                <Button size="sm" variant="ghost" disabled={pending} onClick={() => handleStatus("CANCELLED")}
                  className="text-red-400 hover:text-red-300">
                  Anuluj
                </Button>
              )}
              {(order.status === "DONE" || order.status === "CANCELLED") && (
                <Button size="sm" variant="outline" disabled={pending} onClick={() => handleStatus("OPEN")} className="gap-1 text-emerald-300 hover:text-emerald-200">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Otwórz ponownie
                </Button>
              )}
              <Button size="sm" variant="outline" disabled={pending} onClick={() => { setErrorMsg(undefined); setEditingOrder(true); }} className="gap-1">
                <Pencil className="h-3.5 w-3.5" />
                Edytuj
              </Button>
              <Button size="sm" variant="ghost" disabled={pending} onClick={handleDelete} className="gap-1 text-red-400 hover:text-red-300">
                <Trash2 className="h-3.5 w-3.5" />
                Usuń
              </Button>
            </>
          )}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="ml-auto flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300"
          >
            {order.workLogs.length} {order.workLogs.length === 1 ? "odbicie" : "odbić"}
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>

        {expanded && (
          <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950 p-3">
            {order.workLogs.length === 0 ? (
              <p className="text-center text-sm text-slate-500">Brak odbić pracy</p>
            ) : (
              order.workLogs.map((log) => (
                <WorkLogRow key={log.id} log={log} canManage={canManage} onError={setErrorMsg} />
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function NewOrderForm({ workers, categories, serviceOptions, initialCustomer, onDone }: { workers: Worker[]; categories: Category[]; serviceOptions: ServiceOption[]; initialCustomer?: Partial<CustomerSuggestion>; onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  const [customerQuery, setCustomerQuery] = useState(initialCustomer?.name ?? "");
  const [customerSuggestions, setCustomerSuggestions] = useState<CustomerSuggestion[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Partial<CustomerSuggestion> | null>(initialCustomer ?? null);
  const [showDueDateCalendar, setShowDueDateCalendar] = useState(false);
  const [showReceivedDateCalendar, setShowReceivedDateCalendar] = useState(false);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [receivedDate, setReceivedDate] = useState<Date>(new Date());

  useEffect(() => {
    if (customerQuery.trim().length < 2) {
      setCustomerSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      const response = await fetch(`/api/customers/search?q=${encodeURIComponent(customerQuery)}`, { signal: controller.signal });
      if (response.ok) {
        setCustomerSuggestions(await response.json());
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [customerQuery]);

  function chooseCustomer(customer: CustomerSuggestion) {
    setSelectedCustomer(customer);
    setCustomerQuery(customer.name);
    setCustomerSuggestions([]);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (dueDate) {
      fd.set("dueDate", format(dueDate, "yyyy-MM-dd"));
    }
    fd.set("receivedDate", format(receivedDate, "yyyy-MM-dd"));
    startTransition(async () => {
      await createProductionOrder(fd);
      onDone();
    });
  }

  return (
    <Card className="border-emerald-800/40 bg-slate-900/70">
      <CardHeader>
        <CardTitle className="text-base">Nowe zlecenie</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs text-slate-400">Nazwa zlecenia *</label>
            <Input name="name" required placeholder="np. Obudowa aluminiowa serii X" className="bg-slate-950" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Klient</label>
            <div className="relative">
              <Input
                name="customer"
                value={customerQuery}
                onChange={(e) => {
                  setCustomerQuery(e.target.value);
                  setSelectedCustomer(null);
                }}
                placeholder="np. ABC Sp. z o.o."
                autoComplete="off"
                className="bg-slate-950"
              />
              {customerSuggestions.length > 0 && (
                <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-slate-700 bg-slate-950 shadow-xl">
                  {customerSuggestions.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => chooseCustomer(customer)}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-800"
                    >
                      <div className="font-medium text-slate-100">{customer.name}</div>
                      <div className="text-xs text-slate-500">{[customer.phone, customer.email, customer.city].filter(Boolean).join(" · ")}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Telefon klienta</label>
            <Input key={`phone-${selectedCustomer?.id ?? "new"}`} name="customerPhone" defaultValue={selectedCustomer?.phone ?? ""} placeholder="opcjonalnie" className="bg-slate-950" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Email klienta</label>
            <Input key={`email-${selectedCustomer?.id ?? "new"}`} name="customerEmail" type="email" defaultValue={selectedCustomer?.email ?? ""} placeholder="opcjonalnie" className="bg-slate-950" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">NIP</label>
            <Input key={`tax-${selectedCustomer?.id ?? "new"}`} name="customerTaxId" defaultValue={selectedCustomer?.taxId ?? ""} placeholder="opcjonalnie" className="bg-slate-950" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Ulica / adres</label>
            <Input key={`street-${selectedCustomer?.id ?? "new"}`} name="customerStreet" defaultValue={selectedCustomer?.street ?? ""} placeholder="opcjonalnie" className="bg-slate-950" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Kod pocztowy</label>
            <Input key={`postal-${selectedCustomer?.id ?? "new"}`} name="customerPostalCode" defaultValue={selectedCustomer?.postalCode ?? ""} placeholder="opcjonalnie" className="bg-slate-950" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Miasto</label>
            <Input key={`city-${selectedCustomer?.id ?? "new"}`} name="customerCity" defaultValue={selectedCustomer?.city ?? ""} placeholder="opcjonalnie" className="bg-slate-950" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Kraj</label>
            <Input key={`country-${selectedCustomer?.id ?? "new"}`} name="customerCountry" defaultValue={selectedCustomer?.country ?? ""} placeholder="opcjonalnie" className="bg-slate-950" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Kategoria</label>
            <select
              name="categoryId"
              className="h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Bez kategorii</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1 relative">
            <label className="text-xs text-slate-400">Termin realizacji</label>
            <div className="relative">
              <Input 
                type="text" 
                readOnly 
                value={dueDate ? format(dueDate, "yyyy-MM-dd") : ""} 
                placeholder="Kliknij aby wybrać datę"
                onClick={() => setShowDueDateCalendar(!showDueDateCalendar)}
                className="bg-slate-950 cursor-pointer z-10"
              />
              {showDueDateCalendar && (
                <div className="absolute z-50 mt-1 rounded-lg border border-slate-700 bg-slate-950 p-2 shadow-xl">
                  <DayPicker
                    mode="single"
                    selected={dueDate}
                    onSelect={(date) => {
                      setDueDate(date);
                      setShowDueDateCalendar(false);
                    }}
                    className="bg-slate-950 text-slate-100"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="space-y-1 relative">
            <label className="text-xs text-slate-400">Data przyjęcia</label>
            <div className="relative">
              <Input 
                type="text" 
                readOnly 
                value={format(receivedDate, "yyyy-MM-dd")} 
                placeholder="Kliknij aby wybrać datę"
                onClick={() => setShowReceivedDateCalendar(!showReceivedDateCalendar)}
                className="bg-slate-950 cursor-pointer z-10"
              />
              {showReceivedDateCalendar && (
                <div className="absolute z-50 mt-1 rounded-lg border border-slate-700 bg-slate-950 p-2 shadow-xl">
                  <DayPicker
                    mode="single"
                    selected={receivedDate}
                    onSelect={(date) => {
                      if (date) setReceivedDate(date);
                      setShowReceivedDateCalendar(false);
                    }}
                    className="bg-slate-950 text-slate-100"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Kolor</label>
            <Input name="color" placeholder="np. RAL 9005" className="bg-slate-950" />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs text-slate-400">Operacje technologiczne</label>
            <div className="grid gap-2 sm:grid-cols-2">
              {serviceOptions.map((option) => (
                <label key={option.id} className="flex items-center gap-2 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm">
                  <input type="checkbox" name="serviceOptionIds" value={option.id} className="h-4 w-4 rounded border-slate-700 bg-slate-950" />
                  {option.name}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Cena</label>
            <Input name="price" type="number" step="0.01" className="bg-slate-950" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Koszt materiału</label>
            <Input name="materialCost" type="number" step="0.01" className="bg-slate-950" />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs text-slate-400">Opis</label>
            <textarea
              name="description"
              rows={2}
              placeholder="Opcjonalny opis zlecenia..."
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs text-slate-400">Uwagi na produkcję</label>
            <textarea
              name="productionComments"
              rows={2}
              placeholder="Uwagi dla działu produkcji..."
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs text-slate-400">Uwagi na biuro</label>
            <textarea
              name="officeComments"
              rows={2}
              placeholder="Uwagi dla biura..."
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="flex items-start gap-3 rounded-md border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                name="workerCanComplete"
                className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-950"
              />
              <div>
                <div className="font-medium text-slate-200">Pracownik może oznaczyć jako zakończone</div>
                <div className="text-xs text-slate-500">
                  Krótkie zlecenia — pracownik sam zamknie po wykonaniu. Zostaw odznaczone dla długich i ogólnych (sprzątanie, prace gospodarcze).
                </div>
              </div>
            </label>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-xs text-slate-400">Przypisani pracownicy</label>
            <div className="grid gap-2 sm:grid-cols-2">
              {workers.length === 0 ? (
                <p className="text-xs italic text-slate-500">Brak aktywnych pracowników.</p>
              ) : (
                workers.map((w) => (
                  <label key={w.id} className="flex items-center gap-2 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      name="assigneeIds"
                      value={w.id}
                      className="h-4 w-4 rounded border-slate-700 bg-slate-950"
                    />
                    <span className="flex-1">{w.name}</span>
                    <span className="text-xs text-slate-500">{w.role}</span>
                  </label>
                ))
              )}
            </div>
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={pending} className="bg-emerald-600 hover:bg-emerald-500">
              {pending ? "Zapisywanie…" : "Utwórz zlecenie"}
            </Button>
            <Button type="button" variant="ghost" onClick={onDone}>
              Anuluj
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function OrdersClient({ orders, workers, userId, role, activeLogId, activeLogOrderId, categories, serviceOptions }: Props) {
  const searchParams = useSearchParams();
  const highlightedOrderId = searchParams.get("order");
  const initialCustomer = searchParams.get("customer")
    ? {
        name: searchParams.get("customer") ?? "",
        phone: searchParams.get("phone"),
        email: searchParams.get("email"),
        taxId: searchParams.get("taxId"),
        street: searchParams.get("street"),
        postalCode: searchParams.get("postalCode"),
        city: searchParams.get("city"),
        country: searchParams.get("country"),
      }
    : undefined;
  const [showForm, setShowForm] = useState(searchParams.get("new") === "1");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const canManage = role === "ADMIN" || role === "BIURO";
  const highlightedOrder = highlightedOrderId ? orders.find((order) => order.id === highlightedOrderId) : undefined;

  useEffect(() => {
    if (!highlightedOrderId) return;
    window.setTimeout(() => {
      document.getElementById(`order-${highlightedOrderId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }, [highlightedOrderId]);

  const filteredOrders = categoryFilter === "all" ? orders : orders.filter((o) => (o.category?.id ?? "none") === categoryFilter || o.id === highlightedOrderId);
  const active = filteredOrders.filter((o) => o.status === "OPEN" || o.status === "IN_PROGRESS");
  const done = filteredOrders.filter((o) => o.status === "DONE" || o.status === "CANCELLED");
  const longRunningLogs = orders.flatMap((order) =>
    order.workLogs
      .filter(isLongRunning)
      .map((log) => ({ ...log, orderNumber: order.number, orderName: order.name }))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30">
            <ClipboardList className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold">Zlecenia produkcyjne</h1>
            <p className="text-sm text-slate-400">{active.length} aktywnych</p>
          </div>
        </div>
        {canManage && !showForm && (
          <Button onClick={() => setShowForm(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-500">
            <Plus className="h-4 w-4" />
            Nowe zlecenie
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 p-3">
        <span className="text-sm text-slate-400">Filtr kategorii:</span>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="h-9 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500">
          <option value="all">Wszystkie</option>
          <option value="none">Bez kategorii</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
      </div>

      {showForm && <NewOrderForm workers={workers} categories={categories} serviceOptions={serviceOptions} initialCustomer={initialCustomer} onDone={() => setShowForm(false)} />}

      {canManage && longRunningLogs.length > 0 && (
        <div className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-4 text-amber-100 ring-1 ring-amber-500/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
            <div className="min-w-0 flex-1">
              <div className="font-semibold">Uwaga: bardzo długie trwające odbicie</div>
              <div className="mt-1 text-sm text-amber-100/80">
                Sprawdź, czy pracownik nie zapomniał zakończyć pracy.
              </div>
              <div className="mt-3 space-y-2">
                {longRunningLogs.map((log) => (
                  <div key={log.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/30 bg-slate-950/70 px-3 py-2 text-sm">
                    <div>
                      <span className="font-semibold">{log.user.name}</span>
                      <span className="text-amber-100/70"> · #{log.orderNumber} · {log.orderName}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-semibold text-amber-300">{formatDuration(new Date(log.startedAt), null)}</div>
                      <div className="text-xs text-amber-100/60">od {formatDateTime(new Date(log.startedAt))}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeLogId && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          <Clock className="h-4 w-4 shrink-0" />
          Masz aktywne odbicie na zleceniu. Zakończ je przed rozpoczęciem nowej pracy.
        </div>
      )}

      {highlightedOrderId && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {highlightedOrder ? `Pokazuję zlecenie #${highlightedOrder.number} · ${highlightedOrder.name}.` : "Nie znaleziono wskazanego zlecenia."}
        </div>
      )}

      {active.length === 0 && !showForm && (
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 py-16 text-center text-slate-500">
          Brak aktywnych zleceń.{canManage ? " Utwórz pierwsze zlecenie." : ""}
        </div>
      )}

      <div className="space-y-4">
        {active.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            workers={workers}
            userId={userId}
            role={role}
            activeLogId={activeLogId}
            activeLogOrderId={activeLogOrderId}
            categories={categories}
            serviceOptions={serviceOptions}
            highlighted={order.id === highlightedOrderId}
          />
        ))}
      </div>

      {done.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer select-none text-sm text-slate-500 hover:text-slate-300">
            Zakończone / anulowane ({done.length})
          </summary>
          <div className="mt-3 space-y-4 opacity-60">
            {done.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                workers={workers}
                userId={userId}
                role={role}
                activeLogId={activeLogId}
                activeLogOrderId={activeLogOrderId}
                categories={categories}
                serviceOptions={serviceOptions}
                highlighted={order.id === highlightedOrderId}
              />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
