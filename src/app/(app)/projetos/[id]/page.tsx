import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { podeAcessarEmpresa } from "@/lib/permissions";
import ProjetoDetalheClient from "./ProjetoDetalheClient";

export default async function ProjetoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = (await getServerSession(authOptions))!;
  const projeto = await prisma.projeto.findUnique({
    where: { id },
    include: {
      empresa: true,
      cliente: true,
      responsavel: true,
      tarefas: { include: { responsavel: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!projeto) notFound();
  if (!(await podeAcessarEmpresa(session.user.id, session.user.role, projeto.empresaId))) {
    redirect("/projetos");
  }
  const usuarios = await prisma.usuario.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } });

  return (
    <ProjetoDetalheClient
      projeto={{
        id: projeto.id,
        titulo: projeto.titulo,
        descricao: projeto.descricao,
        status: projeto.status,
        tag: projeto.tag,
        prazo: projeto.prazo?.toISOString() ?? null,
        empresaNome: projeto.empresa.nome,
        empresaCor: projeto.empresa.cor,
        clienteNome: projeto.cliente?.nome ?? null,
        responsavelNome: projeto.responsavel?.nome ?? null,
      }}
      tarefasIniciais={projeto.tarefas.map((t) => ({
        id: t.id,
        titulo: t.titulo,
        descricao: t.descricao,
        status: t.status,
        tag: t.tag,
        prazo: t.prazo?.toISOString() ?? null,
        responsavelId: t.responsavelId,
        responsavelNome: t.responsavel?.nome ?? null,
      }))}
      usuarios={usuarios.map((u) => ({ id: u.id, nome: u.nome }))}
    />
  );
}
