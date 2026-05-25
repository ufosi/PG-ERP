import { redirect } from "next/navigation";
import { Package } from "lucide-react";
import { auth } from "@/auth";
import { ModulePage } from "@/components/module-page";

export default async function WarehousePage() {
  const session = await auth();
  if (session!.user.role === "PRACOWNIK") {
    redirect("/produkcja");
  }

  return (
    <ModulePage
      title="Magazyn"
      description="Podstawy pod przyjęcia, wydania, stany magazynowe i rezerwacje materiałów."
      icon={Package}
      items={["Stany", "Przyjęcia", "Wydania"]}
    />
  );
}
