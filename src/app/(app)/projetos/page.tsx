import { getServerSession } from "next-auth";
import { authOptions, getEmpresasDoUsuario } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { empresaIdsDoUsuario } from "@/lib/permissions";
import ProjetosClient from "./ProjetosClient";

export default async function ProjetosPage() {
  const session = (await getServerSession(authOptions))!;
  const empresas = await getEmpresasDoUsuario(session.user.id, session.user.role);
  const ids = await empresaIdsDoUsuario(session.user.id, session.user.role);

  const [projetos, clientes, usuarios] = await Promise.all([
    prisma.projeto.findMany({
      where: { empresaId: { in: ids } },
      include: {
        empresa: true,
        cliente: true,
        responsavel: true,
        tarefas: { select: { id: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.cliente.findMany({ where: { empresaId: { in: ids } }, orderBy: { nome: "asc" } }),
    prisma.usuario.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
  ]);

  return (
    <ProjetosClient
      empresas={empresas.map((e) => ({ id: e.id, nome: e.nome, cor: e.cor }))}
      clientes={clientes.map((c) => ({ id: c.id, nome: c.nome, empresaId: c.empresaId }))}
      usuarios={usuarios.map((u) => ({ id: u.id, nome: u.nome, role: u.role }))}
      projetosIniciais={projetos.map((p) => ({
        id: p.id,
        titulo: p.titulo,
        descricao: p.descricao,
        status: p.status,
        tag: p.tag,
        prazo: p.prazo?.toISOString() ?? null,
        empresaId: p.empresaId,
        empresaNome: p.empresa.nome,
        empresaCor: p.empresa.cor,
        clienteId: p.clienteId,
        clienteNome: p.cliente?.nome ?? null,
        responsavelId: p.responsavelId,
        responsavelNome: p.responsavel?.nome ?? null,
        totalTarefas: p.tarefas.length,
        tarefasConcluidas: p.tarefas.filter((t) => t.status === "CONCLUIDO").length,
      }))}
    />
  );
}
