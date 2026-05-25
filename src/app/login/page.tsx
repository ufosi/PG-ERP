import { Factory } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.18),_transparent_35%),linear-gradient(135deg,#020617,#0f172a_55%,#020617)] p-6">
      <Card className="w-full max-w-md border-slate-800 bg-slate-950/80 shadow-2xl shadow-emerald-950/40 backdrop-blur">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30">
            <Factory className="h-8 w-8" />
          </div>
          <div>
            <CardTitle className="text-3xl">PG-ERP</CardTitle>
            <CardDescription className="mt-2">Szybkie logowanie dla produkcji, biura i administracji</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
