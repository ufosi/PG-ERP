import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/types/roles";

const loginSchema = z.object({
  pin: z.string().min(3).max(16),
  rfid: z.string().optional(),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        pin: { label: "PIN", type: "password" },
        rfid: { label: "RFID", type: "text" },
      },
      async authorize(credentials) {
        const parsedCredentials = loginSchema.safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const { pin, rfid } = parsedCredentials.data;
        const users = await prisma.user.findMany({
          where: {
            active: true,
            ...(rfid ? { rfid } : {}),
          },
        });

        for (const user of users) {
          const pinMatches = await bcrypt.compare(pin, user.pinHash);

          if (pinMatches) {
            await prisma.user.update({
              where: { id: user.id },
              data: { lastLoginAt: new Date() },
            });

            return {
              id: user.id,
              name: user.name,
              role: user.role,
            };
          }
        }

        return null;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role as UserRole;
      }

      return session;
    },
  },
});
