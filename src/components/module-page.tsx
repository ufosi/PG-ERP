import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ModulePage({
  title,
  description,
  icon: Icon,
  items,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  items: string[];
}) {
  return (
    <div className="space-y-6">
      <Card className="border-slate-800 bg-slate-900/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30">
              <Icon className="h-6 w-6" />
            </span>
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
      <div className="grid gap-4 lg:grid-cols-3">
        {items.map((item) => (
          <Card key={item} className="border-slate-800 bg-slate-900/70">
            <CardHeader>
              <CardTitle className="text-lg">{item}</CardTitle>
              <CardDescription>Moduł przygotowany pod dalszą konfigurację</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-dashed border-slate-700 bg-slate-950 p-4 text-sm text-slate-400">
                Brak danych testowych. W kolejnym kroku można dodać formularze, tabele i integrację z bazą.
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
