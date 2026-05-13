import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, podeAcessarEmpresa } from "@/lib/permissions";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();
  const tarefa = await prisma.tarefa.findUnique({
    where: { id },
    include: { projeto: true },
  });
  if (!tarefa) return NextResponse.json({ error: "Tarefa não encontrada." }, { status: 404 });
  if (!(await podeAcessarEmpresa(session.user.id, session.user.role, tarefa.projeto.empresaId))) {
    return NextResponse.json({ error: "Sem acesso." }, { status: 403 });
  }

  const rodando = await prisma.tempoTarefa.findFirst({
    where: { tarefaId: id, usuarioId: session.user.id, fim: null },
    orderBy: { inicio: "desc" },
  });
  if (!rodando) {
    return NextResponse.json({ error: "Nenhum timer ativo para esta tarefa." }, { status: 400 });
  }

  const agora = new Date();
  const dur = Math.max(0, Math.floor((agora.getTime() - new Date(rodando.inicio).getTime()) / 1000));
  const atualizado = await prisma.tempoTarefa.update({
    where: { id: rodando.id },
    data: { fim: agora, duracaoSegundos: dur },
  });
  return NextResponse.json(atualizado);
}
