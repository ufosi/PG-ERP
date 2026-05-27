"use client";

import { useEffect, useState, use } from "react";
import { formatDate } from "@/lib/time";

export default function PrintOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const response = await fetch(`/api/orders/${resolvedParams.id}/print`);
        if (!response.ok) {
          throw new Error("Failed to fetch order");
        }
        const data = await response.json();
        // Convert date strings to Date objects
        if (data.createdAt) data.createdAt = new Date(data.createdAt);
        if (data.dueDate) data.dueDate = new Date(data.dueDate);
        setOrder(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error fetching order");
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [resolvedParams.id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-black">Ładowanie...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">Błąd: {error}</div>;
  }

  if (!order) {
    return <div className="min-h-screen flex items-center justify-center text-black">Zlecenie nie znalezione</div>;
  }

  return (
    <div className="min-h-screen bg-white p-4 text-black print:p-2 print:bg-white print:text-black">
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          header, nav, .sidebar, .navbar, [role="navigation"] {
            display: none !important;
            visibility: hidden !important;
          }
          body > *:not(.min-h-screen) {
            display: none !important;
          }
          .min-h-screen {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 10px !important;
            background: white !important;
            color: black !important;
          }
          @page {
            margin: 0.5cm;
          }
        }
      `}</style>
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-4 border-b-2 border-black pb-2">
          <h1 className="text-2xl font-bold">KARTA ZLECENIA PRODUKCYJNEGO</h1>
          <div className="mt-1 text-xs text-gray-600">
            Wygenerowano: {formatDate(new Date())}
          </div>
        </div>

        {/* Order Info */}
        <div className="mb-3 grid grid-cols-2 gap-2 rounded-lg border-2 border-black p-2 text-xs">
          <div>
            <div className="text-xs font-bold text-gray-600">Numer zlecenia</div>
            <div className="text-base font-mono font-bold">{order.number}</div>
          </div>
          <div>
            <div className="text-xs font-bold text-gray-600">Data utworzenia</div>
            <div className="text-sm">{formatDate(order.createdAt)}</div>
          </div>
          <div className="col-span-2">
            <div className="text-xs font-bold text-gray-600">Nazwa zlecenia</div>
            <div className="text-base font-bold">{order.name}</div>
          </div>
          {order.customer && (
            <div className="col-span-2">
              <div className="text-xs font-bold text-gray-600">Klient</div>
              <div className="text-sm">{order.customer}</div>
            </div>
          )}
          {order.dueDate && (
            <div className="col-span-2">
              <div className="text-xs font-bold text-gray-600">Termin realizacji</div>
              <div className="text-sm">{formatDate(order.dueDate)}</div>
            </div>
          )}
        </div>

        {/* Description */}
        {order.description && (
          <div className="mb-3 rounded-lg border-2 border-black p-2">
            <div className="mb-1 text-xs font-bold text-gray-600">Opis</div>
            <div className="whitespace-pre-wrap text-sm">{order.description}</div>
          </div>
        )}

        {/* Category */}
        {order.category && (
          <div className="mb-3 rounded-lg border-2 border-black p-2">
            <div className="text-xs font-bold text-gray-600">Kategoria</div>
            <div className="text-sm">{order.category.name}</div>
          </div>
        )}

        {/* Service Options */}
        {order.serviceOptions.length > 0 && (
          <div className="mb-3 rounded-lg border-2 border-black p-2">
            <div className="mb-2 text-xs font-bold text-gray-600">Operacje technologiczne (wpisz faktyczny czas pracy w minutach)</div>
            <div className="space-y-2">
              {order.serviceOptions.map((opt: { id: string; name: string }) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <div className="flex-1 text-sm">{opt.name}</div>
                  <div className="h-6 w-16 border-2 border-black"></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Color */}
        {order.color && (
          <div className="mb-3 rounded-lg border-2 border-black p-2">
            <div className="text-xs font-bold text-gray-600">Kolor</div>
            <div className="text-sm">{order.color}</div>
          </div>
        )}

        {/* Project Details */}
        {order.projectDetails && (
          <div className="mb-3 rounded-lg border-2 border-black p-2">
            <div className="mb-1 text-xs font-bold text-gray-600">Szczegóły projektu</div>
            <div className="whitespace-pre-wrap text-sm">{order.projectDetails}</div>
          </div>
        )}

        {/* Production Comments */}
        {order.productionComments && (
          <div className="mb-3 rounded-lg border-2 border-black p-2">
            <div className="mb-1 text-xs font-bold text-gray-600">Uwagi na produkcję</div>
            <div className="whitespace-pre-wrap text-sm">{order.productionComments}</div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 border-t-2 border-black pt-2 text-center text-xs text-gray-600">
          <div>Utworzone przez: {order.createdBy?.name || "Nieznany"} · PG-ERP System</div>
        </div>

        {/* Print Button */}
        <div className="mt-8 flex justify-center print:hidden">
          <button
            onClick={() => window.print()}
            className="rounded-lg bg-black px-6 py-3 text-white font-bold hover:bg-gray-800"
          >
            DRUKUJ
          </button>
        </div>
      </div>
    </div>
  );
}
