import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: "credentials",
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
    Credentials({
      id: "parent",
      credentials: {
        phone: {},
        password: {},
      },
      authorize: async (credentials) => {
        const phone = credentials?.phone as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!phone || !password) return null;

        const account = await prisma.parentAccount.findUnique({ where: { phone } });
        if (!account) return null;

        const valid = await bcrypt.compare(password, account.passwordHash);
        if (!valid) return null;

        return { id: account.id, name: account.name ?? phone, role: "PARENT" };
      },
    }),
  ],
});
