"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Building2, ClipboardList, Mail, MapPin, Phone, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/time";
import { createCustomer } from "./actions";

type CustomerOrder = {
  id: string;
  number: string;
  name: string;
  status: string;
  workflow: string;
  dueDate: Date | null;
  price: number | null;
  materialCost: number | null;
  createdAt: Date;
};

type Customer = {
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
  orders: CustomerOrder[];
};

function orderCreateHref(customer: Customer) {
  const params = new URLSearchParams({
    new: "1",
    customer: customer.name,
  });

  if (customer.phone) params.set("phone", customer.phone);
  if (customer.email) params.set("email", customer.email);
  if (customer.taxId) params.set("taxId", customer.taxId);
  if (customer.street) params.set("street", customer.street);
  if (customer.postalCode) params.set("postalCode", customer.postalCode);
  if (customer.city) params.set("city", customer.city);
  if (customer.country) params.set("country", customer.country);

  return `/zlecenia?${params.toString()}`;
}

function NewCustomerForm({ onDone }: { onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(undefined);
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      try {
        await createCustomer(fd);
        form.reset();
        onDone();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nie udało się zapisać klienta.");
      }
    });
  }

  return (
    <Card className="border-emerald-800/40 bg-slate-900/70">
      <CardHeader>
        <CardTitle className="text-base">Nowy klient</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Nazwa *</label>
            <Input name="name" required minLength={2} maxLength={120} className="bg-slate-950" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">NIP</label>
            <Input name="taxId" maxLength={30} className="bg-slate-950" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Telefon</label>
            <Input name="phone" maxLength={50} className="bg-slate-950" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Email</label>
            <Input name="email" type="email" maxLength={120} className="bg-slate-950" />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs text-slate-400">Ulica / adres</label>
            <Input name="street" maxLength={120} className="bg-slate-950" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Kod pocztowy</label>
            <Input name="postalCode" maxLength={20} className="bg-slate-950" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Miasto</label>
            <Input name="city" maxLength={80} className="bg-slate-950" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Kraj</label>
            <Input name="country" maxLength={80} className="bg-slate-950" />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs text-slate-400">Notatki</label>
            <textarea name="notes" rows={2} maxLength={1000} className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          {error && <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200 sm:col-span-2">{error}</div>}
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={pending} className="bg-emerald-600 hover:bg-emerald-500">{pending ? "Zapisywanie…" : "Dodaj klienta"}</Button>
            <Button type="button" variant="ghost" onClick={onDone}>Anuluj</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function CustomersClient({ customers }: { customers: Customer[] }) {
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);

  const filteredCustomers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return customers;

    return customers.filter((customer) => [
      customer.name,
      customer.phone,
      customer.email,
      customer.taxId,
      customer.street,
      customer.postalCode,
      customer.city,
      customer.country,
      customer.notes,
      ...customer.orders.flatMap((order) => [order.number, order.name, order.status, order.workflow]),
    ].filter(Boolean).some((value) => String(value).toLowerCase().includes(normalized)));
  }, [customers, query]);

  return (
    <div className="space-y-6 text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Klienci</h1>
          <p className="text-sm text-slate-400">Karty klientów, dane kontaktowe i historia zleceń.</p>
        </div>
        {!showForm && <Button onClick={() => setShowForm(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-500"><Plus className="h-4 w-4" />Nowy klient</Button>}
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 p-3">
        <Search className="h-4 w-4 text-slate-500" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Szukaj po nazwie, telefonie, emailu, NIP, mieście albo zleceniu..." className="border-0 bg-transparent focus-visible:ring-0" />
        {query && <button type="button" onClick={() => setQuery("")} className="text-slate-500 hover:text-slate-200"><X className="h-4 w-4" /></button>}
      </div>

      {showForm && <NewCustomerForm onDone={() => setShowForm(false)} />}

      {filteredCustomers.length === 0 ? (
        <Card className="border-slate-800 bg-slate-900/70">
          <CardContent className="p-8 text-center text-slate-400">Nie znaleziono klientów.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredCustomers.map((customer) => (
            <Card key={customer.id} className="border-slate-800 bg-slate-900/70">
              <CardHeader>
                <CardTitle className="flex flex-wrap items-start justify-between gap-3 text-lg">
                  <span className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300"><Building2 className="h-5 w-5" /></span>
                    <span>{customer.name}{customer.taxId && <span className="mt-1 block text-xs font-normal text-slate-500">NIP: {customer.taxId}</span>}</span>
                  </span>
                  <Link href={orderCreateHref(customer)} className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500">Utwórz zlecenie</Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
                  {customer.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-500" />{customer.phone}</div>}
                  {customer.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-500" />{customer.email}</div>}
                  {(customer.street || customer.city) && <div className="flex items-start gap-2 sm:col-span-2"><MapPin className="mt-0.5 h-4 w-4 text-slate-500" /><span>{[customer.street, [customer.postalCode, customer.city].filter(Boolean).join(" "), customer.country].filter(Boolean).join(", ")}</span></div>}
                </div>

                <div>
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200"><ClipboardList className="h-4 w-4 text-slate-500" />Historia zleceń ({customer.orders.length})</div>
                  <div className="space-y-2">
                    {customer.orders.length === 0 ? <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm text-slate-500">Brak zleceń.</div> : customer.orders.map((order) => (
                      <Link key={order.id} href={`/zlecenia?order=${order.id}`} className="block rounded-lg border border-slate-800 bg-slate-950 p-3 transition hover:border-emerald-500/40">
                        <div className="flex flex-wrap items-center justify-between gap-2"><div className="font-medium">#{order.number} · {order.name}</div><div className="text-xs text-slate-500">{order.workflow === "SIMPLE" ? "Prosty" : "Rozszerzone"}</div></div>
                        <div className="mt-1 text-xs text-slate-500">{order.dueDate ? `Termin: ${formatDate(order.dueDate)}` : `Utworzono: ${formatDate(order.createdAt)}`}{order.price !== null ? ` · Cena: ${order.price.toFixed(2)} zł` : ""}</div>
                      </Link>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
