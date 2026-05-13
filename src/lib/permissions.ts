import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { prisma } from "./prisma";

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Response("Não autenticado.", { status: 401 });
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if (session.user.role !== "ADMIN") {
    throw new Response("Acesso restrito a administradores.", { status: 403 });
  }
  return session;
}

export async function empresaIdsDoUsuario(userId: string, role: string): Promise<string[]> {
  if (role === "ADMIN") {
    const empresas = await prisma.empresa.findMany({ select: { id: true } });
    return empresas.map((e) => e.id);
  }
  const links = await prisma.usuarioEmpresa.findMany({
    where: { usuarioId: userId },
    select: { empresaId: true },
  });
  return links.map((l) => l.empresaId);
}

export async function podeAcessarEmpresa(userId: string, role: string, empresaId: string) {
  const ids = await empresaIdsDoUsuario(userId, role);
  return ids.includes(empresaId);
}
