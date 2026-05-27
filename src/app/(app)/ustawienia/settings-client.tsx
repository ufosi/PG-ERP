"use client";

import { useState, useTransition, useEffect } from "react";
import { ClipboardList, Settings, Workflow, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createJobServiceOption, createProductionOrderCategory, deleteJobServiceOption, deleteProductionOrderCategory } from "../zlecenia/actions";

type Category = { id: string; name: string };
type ServiceOption = { id: string; name: string };

type WarningSettings = {
  yellowWarningDays: number;
  redWarningDays: number;
};

function WarningSettings() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [settings, setSettings] = useState<WarningSettings>({
    yellowWarningDays: 7,
    redWarningDays: 3,
  });

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => setSettings(data))
      .catch(() => {});
  }, []);

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(undefined);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const yellowWarningDays = parseInt(fd.get("yellowWarningDays") as string);
    const redWarningDays = parseInt(fd.get("redWarningDays") as string);

    startTransition(async () => {
      try {
        const res = await fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ yellowWarningDays, redWarningDays }),
        });
        if (!res.ok) throw new Error("Nie udało się zapisać ustawień.");
        const data = await res.json();
        setSettings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nie udało się zapisać ustawień.");
      }
    });
  }

  return (
    <Card className="border-slate-800 bg-slate-900/70">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="h-4 w-4" />Podświetlanie zleceń</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <form onSubmit={handleSave} className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-32">
            <label className="text-xs text-slate-400 mb-1 block">Żółte ostrzeżenie (dni)</label>
            <Input 
              name="yellowWarningDays" 
              type="number" 
              min="0" 
              defaultValue={settings.yellowWarningDays}
              className="bg-slate-950" 
            />
          </div>
          <div className="flex-1 min-w-32">
            <label className="text-xs text-slate-400 mb-1 block">Czerwone ostrzeżenie (dni)</label>
            <Input 
              name="redWarningDays" 
              type="number" 
              min="0" 
              defaultValue={settings.redWarningDays}
              className="bg-slate-950" 
            />
          </div>
          <Button type="submit" disabled={pending} className="bg-emerald-600 hover:bg-emerald-500">Zapisz</Button>
        </form>
        {error && <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}
        <p className="text-xs text-slate-500">
          Zlecenia z terminem realizacji w ciągu {settings.yellowWarningDays} dni będą podświetlone na żółto, 
          a w ciągu {settings.redWarningDays} dni na czerwono.
        </p>
      </CardContent>
    </Card>
  );
}

function CategorySettings({ categories }: { categories: Category[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(undefined);
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      try {
        await createProductionOrderCategory(fd);
        form.reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nie udało się dodać kategorii.");
      }
    });
  }

  function handleDelete(category: Category) {
    if (!confirm(`Usunąć kategorię "${category.name}"? Zlecenia z tą kategorią zostaną bez kategorii.`)) return;
    setError(undefined);
    const fd = new FormData();
    fd.set("categoryId", category.id);
    startTransition(async () => {
      try {
        await deleteProductionOrderCategory(fd);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nie udało się usunąć kategorii.");
      }
    });
  }

  return (
    <Card className="border-slate-800 bg-slate-900/70">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><ClipboardList className="h-4 w-4" />Kategorie zleceń</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <form onSubmit={handleCreate} className="flex flex-wrap gap-2">
          <Input name="name" required minLength={2} maxLength={80} placeholder="np. Produkcja, Lakiernia, Plazma" className="min-w-64 flex-1 bg-slate-950" />
          <Button type="submit" disabled={pending} className="bg-emerald-600 hover:bg-emerald-500">Dodaj kategorię</Button>
        </form>
        {error && <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}
        <div className="flex flex-wrap gap-2">
          {categories.length === 0 ? <span className="text-sm text-slate-500">Brak kategorii.</span> : categories.map((category) => (
            <span key={category.id} className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-200 ring-1 ring-slate-700">
              {category.name}
              <button type="button" disabled={pending} onClick={() => handleDelete(category)} className="text-slate-500 hover:text-red-300"><X className="h-3.5 w-3.5" /></button>
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function OperationSettings({ serviceOptions }: { serviceOptions: ServiceOption[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(undefined);
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      try {
        await createJobServiceOption(fd);
        form.reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nie udało się dodać operacji.");
      }
    });
  }

  function handleDelete(option: ServiceOption) {
    if (!confirm(`Usunąć operację "${option.name}" z listy dostępnych operacji technologicznych?`)) return;
    setError(undefined);
    const fd = new FormData();
    fd.set("serviceOptionId", option.id);
    startTransition(async () => {
      try {
        await deleteJobServiceOption(fd);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nie udało się usunąć operacji.");
      }
    });
  }

  return (
    <Card className="border-slate-800 bg-slate-900/70">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Workflow className="h-4 w-4" />Operacje technologiczne</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <form onSubmit={handleCreate} className="flex flex-wrap gap-2">
          <Input name="name" required minLength={2} maxLength={80} placeholder="np. Malowanie proszkowe" className="min-w-64 flex-1 bg-slate-950" />
          <Button type="submit" disabled={pending} className="bg-emerald-600 hover:bg-emerald-500">Dodaj operację</Button>
        </form>
        {error && <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}
        <div className="flex flex-wrap gap-2">
          {serviceOptions.length === 0 ? <span className="text-sm text-slate-500">Brak operacji.</span> : serviceOptions.map((option) => (
            <span key={option.id} className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-200 ring-1 ring-slate-700">
              {option.name}
              <button type="button" disabled={pending} onClick={() => handleDelete(option)} className="text-slate-500 hover:text-red-300"><X className="h-3.5 w-3.5" /></button>
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function SettingsClient({ categories, serviceOptions }: { categories: Category[]; serviceOptions: ServiceOption[] }) {
  return (
    <div className="space-y-6 text-slate-100">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30"><Settings className="h-6 w-6" /></span>
        <div>
          <h1 className="text-2xl font-semibold">Ustawienia</h1>
          <p className="text-sm text-slate-400">Słowniki i konfiguracja rzadko zmienianych elementów systemu.</p>
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <WarningSettings />
        <CategorySettings categories={categories} />
        <OperationSettings serviceOptions={serviceOptions} />
      </div>
    </div>
  );
}
