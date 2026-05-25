"use client";

import { useState, useTransition } from "react";
import { KeyRound, Pencil, Plus, Power, Radio, Shield, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createUser, toggleUserActive, updateUser } from "./actions";
import { ROLE_LABELS } from "@/types/roles";
import { formatDateTime } from "@/lib/time";

type Employee = {
  id: string;
  name: string;
  rfid: string | null;
  role: string;
  active: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  _count: { workLogs: number };
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-red-500/15 text-red-300 ring-red-500/30",
  BIURO: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
  PRACOWNIK: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
};

function RoleBadge({ role }: { role: string }) {
  const cls = ROLE_COLORS[role] ?? "bg-slate-700 text-slate-300 ring-slate-600";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${cls}`}>
      <Shield className="h-3 w-3" />
      {ROLE_LABELS[role as keyof typeof ROLE_LABELS] ?? role}
    </span>
  );
}

function EmployeeForm({
  initial,
  onDone,
}: {
  initial?: Employee;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const isEdit = !!initial;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(undefined);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        if (isEdit) {
          fd.set("id", initial!.id);
          await updateUser(fd);
        } else {
          await createUser(fd);
        }
        onDone();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nie udało się zapisać.");
      }
    });
  }

  return (
    <Card className="border-emerald-800/40 bg-slate-900/70">
      <CardHeader>
        <CardTitle className="text-base">{isEdit ? `Edycja: ${initial!.name}` : "Nowy pracownik"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs text-slate-400">Imię i nazwisko *</label>
            <Input name="name" required defaultValue={initial?.name ?? ""} className="bg-slate-950" />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400">Rola *</label>
            <select
              name="role"
              required
              defaultValue={initial?.role ?? "PRACOWNIK"}
              className="h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="PRACOWNIK">Pracownik</option>
              <option value="BIURO">Biuro</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400">RFID (opcjonalnie)</label>
            <Input name="rfid" defaultValue={initial?.rfid ?? ""} placeholder="np. PRAC-007" className="bg-slate-950" />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs text-slate-400">
              {isEdit ? "Nowy PIN (zostaw puste, aby nie zmieniać)" : "PIN *"}
            </label>
            <Input
              name="pin"
              type="password"
              inputMode="numeric"
              pattern="\d{4,8}"
              required={!isEdit}
              placeholder="4-8 cyfr"
              className="bg-slate-950 font-mono tracking-widest"
            />
          </div>

          <div className="flex items-center gap-2 sm:col-span-2">
            <input
              id="active"
              name="active"
              type="checkbox"
              defaultChecked={initial?.active ?? true}
              className="h-4 w-4 rounded border-slate-700 bg-slate-950"
            />
            <label htmlFor="active" className="text-sm text-slate-300">
              Konto aktywne (może się logować)
            </label>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200 sm:col-span-2">
              {error}
            </div>
          )}

          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={pending} className="bg-emerald-600 hover:bg-emerald-500">
              {pending ? "Zapisywanie…" : isEdit ? "Zapisz zmiany" : "Utwórz pracownika"}
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

function EmployeeRow({
  user,
  onEdit,
}: {
  user: Employee;
  onEdit: () => void;
}) {
  const [pending, startTransition] = useTransition();

  function handleToggle() {
    const fd = new FormData();
    fd.set("id", user.id);
    startTransition(() => toggleUserActive(fd));
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-4 rounded-xl border p-4 transition ${
        user.active
          ? "border-slate-800 bg-slate-900/70"
          : "border-slate-800 bg-slate-900/30 opacity-60"
      }`}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-300">
        <User className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{user.name}</span>
          <RoleBadge role={user.role} />
          {!user.active && (
            <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs text-red-300 ring-1 ring-red-500/30">
              Wyłączony
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          {user.rfid && (
            <span className="flex items-center gap-1">
              <Radio className="h-3 w-3" />
              {user.rfid}
            </span>
          )}
          <span>Odbicia: {user._count.workLogs}</span>
          {user.lastLoginAt && <span>Ostatnio: {formatDateTime(new Date(user.lastLoginAt))}</span>}
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={onEdit} disabled={pending} className="gap-1">
          <Pencil className="h-3.5 w-3.5" />
          Edytuj
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleToggle}
          disabled={pending}
          className={`gap-1 ${user.active ? "text-amber-400 hover:text-amber-300" : "text-emerald-400 hover:text-emerald-300"}`}
        >
          <Power className="h-3.5 w-3.5" />
          {user.active ? "Wyłącz" : "Włącz"}
        </Button>
      </div>
    </div>
  );
}

export function EmployeesClient({ users }: { users: Employee[] }) {
  const [mode, setMode] = useState<{ kind: "list" } | { kind: "new" } | { kind: "edit"; user: Employee }>({
    kind: "list",
  });

  const active = users.filter((u) => u.active);
  const inactive = users.filter((u) => !u.active);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30">
            <Users className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold">Pracownicy</h1>
            <p className="text-sm text-slate-400">{active.length} aktywnych, {inactive.length} wyłączonych</p>
          </div>
        </div>
        {mode.kind === "list" && (
          <Button onClick={() => setMode({ kind: "new" })} className="gap-2 bg-emerald-600 hover:bg-emerald-500">
            <Plus className="h-4 w-4" />
            Nowy pracownik
          </Button>
        )}
      </div>

      {mode.kind === "new" && <EmployeeForm onDone={() => setMode({ kind: "list" })} />}
      {mode.kind === "edit" && <EmployeeForm initial={mode.user} onDone={() => setMode({ kind: "list" })} />}

      {mode.kind === "list" && (
        <>
          <div className="space-y-2">
            {active.map((u) => (
              <EmployeeRow key={u.id} user={u} onEdit={() => setMode({ kind: "edit", user: u })} />
            ))}
            {active.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 py-12 text-center text-slate-500">
                Brak aktywnych pracowników.
              </div>
            )}
          </div>

          {inactive.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer select-none text-sm text-slate-500 hover:text-slate-300">
                Wyłączone konta ({inactive.length})
              </summary>
              <div className="mt-3 space-y-2">
                {inactive.map((u) => (
                  <EmployeeRow key={u.id} user={u} onEdit={() => setMode({ kind: "edit", user: u })} />
                ))}
              </div>
            </details>
          )}

          <Card className="border-slate-800 bg-slate-900/40">
            <CardContent className="flex items-start gap-3 pt-6 text-sm text-slate-400">
              <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <div>
                <strong className="text-slate-300">Bezpieczeństwo:</strong> PIN-y są przechowywane wyłącznie jako hash (bcrypt). Nie da się ich odczytać — można jedynie ustawić nowy podczas edycji konta.
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
