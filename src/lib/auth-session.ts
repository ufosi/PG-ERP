import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getToken } from "next-auth/jwt";
import { auth } from "@/auth";
import type { UserRole } from "@/types/roles";

export async function requireUserSession() {
  const session = await auth();

  if (session?.user) {
    return session;
  }

  const token = await getToken({
    req: { headers: await headers() },
    secret: process.env.AUTH_SECRET,
    secureCookie: false,
    cookieName: "authjs.session-token",
  });

  if (!token?.sub || !token.role) {
    redirect("/login");
  }

  return {
    user: {
      id: token.sub,
      name: token.name,
      email: token.email,
      image: token.picture,
      role: token.role as UserRole,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}
