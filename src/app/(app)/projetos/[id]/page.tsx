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
      tarefas: {
        include: {
          responsavel: true,
          tempos: { orderBy: { inicio: "desc" } },
        },
        orderBy: { createdAt: "desc" },
      },
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
      tarefasIniciais={projeto.tarefas.map((t) => {
        const tempoConcluido = t.tempos
          .filter((x) => x.fim && x.duracaoSegundos)
          .reduce((acc, x) => acc + (x.duracaoSegundos || 0), 0);
        const rodando = t.tempos.find((x) => !x.fim);
        return {
          id: t.id,
          titulo: t.titulo,
          descricao: t.descricao,
          status: t.status,
          tag: t.tag,
          prazo: t.prazo?.toISOString() ?? null,
          responsavelId: t.responsavelId,
          responsavelNome: t.responsavel?.nome ?? null,
          tempoTotalSegundos: tempoConcluido,
          timerInicio: rodando ? rodando.inicio.toISOString() : null,
          timerUsuarioId: rodando ? rodando.usuarioId : null,
        };
      })}
      usuarios={usuarios.map((u) => ({ id: u.id, nome: u.nome }))}
      currentUserId={session.user.id}
    />
  );
}
