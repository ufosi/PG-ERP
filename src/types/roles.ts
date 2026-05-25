export type UserRole = "ADMIN" | "BIURO" | "PRACOWNIK";

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrator",
  BIURO: "Biuro",
  PRACOWNIK: "Pracownik",
};

export function isManager(role: string): boolean {
  return role === "ADMIN" || role === "BIURO";
}

export function isAdmin(role: string): boolean {
  return role === "ADMIN";
}
