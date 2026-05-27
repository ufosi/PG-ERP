import { requireUserSession } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/time";
import { notFound } from "next/navigation";

export default async function PrintOrderPage({ params }: { params: { id: string } }) {
  const session = await requireUserSession();
  const role = session.user.role;
  const canManage = role === "ADMIN" || role === "BIURO";

  if (!canManage) {
    return <div>Brak uprawnień</div>;
  }

  const order = await prisma.productionOrder.findUnique({
    where: { id: params.id },
    include: {
      assignees: { select: { id: true, name: true, role: true } },
      category: { select: { id: true, name: true } },
      serviceOptions: { select: { id: true, name: true } },
      createdBy: { select: { name: true } },
      workLogs: {
        include: {
          user: { select: { name: true } },
        },
        orderBy: { startedAt: "desc" },
      },
    },
  });

  if (!order) {
    notFound();
  }

  const statusLabels: Record<string, string> = {
    NEW: "Nowe",
    IN_PROGRESS: "W toku",
    COMPLETED: "Zrealizowane",
    READY_FOR_PICKUP: "Gotowe do odbioru",
    DONE: "Zakończone",
    CANCELLED: "Anulowane",
  };

  return (
    <div className="min-h-screen bg-white p-8 text-black print:p-4">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 border-b-2 border-black pb-4">
          <h1 className="text-3xl font-bold">KARTA ZLECENIA PRODUKCYJNEGO</h1>
          <div className="mt-2 text-sm text-gray-600">
            Wygenerowano: {formatDate(new Date())}
          </div>
        </div>

        {/* Order Info */}
        <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg border-2 border-black p-4">
          <div>
            <div className="text-sm font-bold text-gray-600">Numer zlecenia</div>
            <div className="text-xl font-mono font-bold">{order.number}</div>
          </div>
          <div>
            <div className="text-sm font-bold text-gray-600">Status</div>
            <div className="text-xl font-bold">{statusLabels[order.status] || order.status}</div>
          </div>
          <div className="col-span-2">
            <div className="text-sm font-bold text-gray-600">Nazwa zlecenia</div>
            <div className="text-xl font-bold">{order.name}</div>
          </div>
          {order.customer && (
            <div className="col-span-2">
              <div className="text-sm font-bold text-gray-600">Klient</div>
              <div className="text-xl">{order.customer}</div>
            </div>
          )}
          {order.dueDate && (
            <div>
              <div className="text-sm font-bold text-gray-600">Termin realizacji</div>
              <div className="text-xl">{formatDate(order.dueDate)}</div>
            </div>
          )}
          <div>
            <div className="text-sm font-bold text-gray-600">Data utworzenia</div>
            <div className="text-xl">{formatDate(order.createdAt)}</div>
          </div>
        </div>

        {/* Description */}
        {order.description && (
          <div className="mb-6 rounded-lg border-2 border-black p-4">
            <div className="mb-2 text-sm font-bold text-gray-600">Opis</div>
            <div className="whitespace-pre-wrap text-base">{order.description}</div>
          </div>
        )}

        {/* Category */}
        {order.category && (
          <div className="mb-6 rounded-lg border-2 border-black p-4">
            <div className="text-sm font-bold text-gray-600">Kategoria</div>
            <div className="text-xl">{order.category.name}</div>
          </div>
        )}

        {/* Service Options */}
        {order.serviceOptions.length > 0 && (
          <div className="mb-6 rounded-lg border-2 border-black p-4">
            <div className="mb-2 text-sm font-bold text-gray-600">Operacje technologiczne</div>
            <ul className="list-inside list-disc text-base">
              {order.serviceOptions.map((opt) => (
                <li key={opt.id}>{opt.name}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Color */}
        {order.color && (
          <div className="mb-6 rounded-lg border-2 border-black p-4">
            <div className="text-sm font-bold text-gray-600">Kolor</div>
            <div className="text-xl">{order.color}</div>
          </div>
        )}

        {/* Project Details */}
        {order.projectDetails && (
          <div className="mb-6 rounded-lg border-2 border-black p-4">
            <div className="mb-2 text-sm font-bold text-gray-600">Szczegóły projektu</div>
            <div className="whitespace-pre-wrap text-base">{order.projectDetails}</div>
          </div>
        )}

        {/* Production Comments */}
        {order.productionComments && (
          <div className="mb-6 rounded-lg border-2 border-black p-4">
            <div className="mb-2 text-sm font-bold text-gray-600">Komentarze produkcji</div>
            <div className="whitespace-pre-wrap text-base">{order.productionComments}</div>
          </div>
        )}

        {/* Assigned Workers */}
        {order.assignees.length > 0 && (
          <div className="mb-6 rounded-lg border-2 border-black p-4">
            <div className="mb-2 text-sm font-bold text-gray-600">Przypisani pracownicy</div>
            <ul className="list-inside list-disc text-base">
              {order.assignees.map((worker) => (
                <li key={worker.id}>
                  {worker.name} ({worker.role})
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 border-t-2 border-black pt-4 text-center text-sm text-gray-600">
          <div>Utworzone przez: {order.createdBy?.name || "Nieznany"}</div>
          <div className="mt-1">PG-ERP System</div>
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
