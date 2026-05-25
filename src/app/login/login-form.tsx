"use client";

import { FormEvent, useState } from "react";
import { KeyRound, Radio } from "lucide-react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      pin: formData.get("pin"),
      rfid: formData.get("rfid"),
      redirect: false,
    });

    setPending(false);

    if (result?.error) {
      setError("Nieprawidłowy PIN lub RFID.");
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-200" htmlFor="pin">
          PIN operatora
        </label>
        <div className="relative">
          <KeyRound className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          <Input id="pin" name="pin" type="password" inputMode="numeric" autoComplete="off" required className="pl-12 text-xl tracking-[0.35em]" />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-200" htmlFor="rfid">
          RFID opcjonalnie
        </label>
        <div className="relative">
          <Radio className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          <Input id="rfid" name="rfid" autoComplete="off" className="pl-12" placeholder="Zeskanuj identyfikator" />
        </div>
      </div>
      {error ? <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">{error}</div> : null}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Logowanie..." : "Wejdź do systemu"}
      </Button>
    </form>
  );
}
