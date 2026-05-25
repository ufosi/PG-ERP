import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import type { UserRole } from "@/types/roles";

export async function requireRole(roles: UserRole[]) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!roles.includes(session.user.role)) {
    notFound();
  }

  return session;
}
