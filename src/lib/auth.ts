import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credenciais",
      credentials: {
        email: { label: "Email", type: "email" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.senha) return null;
        const user = await prisma.usuario.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });
        if (!user || !user.ativo) return null;
        const ok = await bcrypt.compare(credentials.senha, user.senhaHash);
        if (!ok) return null;
        return { id: user.id, name: user.nome, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
};

export async function getEmpresasDoUsuario(userId: string, role: string) {
  if (role === "ADMIN") {
    return prisma.empresa.findMany({ orderBy: { nome: "asc" } });
  }
  const links = await prisma.usuarioEmpresa.findMany({
    where: { usuarioId: userId },
    include: { empresa: true },
  });
  return links.map((l) => l.empresa).sort((a, b) => a.nome.localeCompare(b.nome));
}
