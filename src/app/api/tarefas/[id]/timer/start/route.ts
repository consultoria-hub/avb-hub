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

  // Para qualquer outro timer rodando do mesmo usuário
  const rodando = await prisma.tempoTarefa.findMany({
    where: { usuarioId: session.user.id, fim: null },
  });
  const agora = new Date();
  for (const r of rodando) {
    const dur = Math.max(0, Math.floor((agora.getTime() - new Date(r.inicio).getTime()) / 1000));
    await prisma.tempoTarefa.update({
      where: { id: r.id },
      data: { fim: agora, duracaoSegundos: dur },
    });
  }

  const novo = await prisma.tempoTarefa.create({
    data: { tarefaId: id, usuarioId: session.user.id, inicio: agora },
  });
  return NextResponse.json(novo, { status: 201 });
}
