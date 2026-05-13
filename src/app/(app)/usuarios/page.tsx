import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import UsuariosClient from "./UsuariosClient";

export default async function UsuariosPage() {
  const session = (await getServerSession(authOptions))!;
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const [usuarios, empresas] = await Promise.all([
    prisma.usuario.findMany({
      include: { empresas: { select: { empresaId: true } } },
      orderBy: { nome: "asc" },
    }),
    prisma.empresa.findMany({ orderBy: { nome: "asc" } }),
  ]);

  return (
    <UsuariosClient
      empresas={empresas.map((e) => ({ id: e.id, nome: e.nome, cor: e.cor }))}
      usuariosIniciais={usuarios.map((u) => ({
        id: u.id,
        nome: u.nome,
        email: u.email,
        role: u.role,
        ativo: u.ativo,
        empresaIds: u.empresas.map((x) => x.empresaId),
      }))}
    />
  );
}
