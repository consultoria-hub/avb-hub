import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, podeAcessarEmpresa } from "@/lib/permissions";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();
  const tarefa = await prisma.tarefa.findUnique({
    where: { id },
    include: { projeto: true },
  });
  if (!tarefa) return NextResponse.json({ error: "Não encontrada." }, { status: 404 });
  if (!(await podeAcessarEmpresa(session.user.id, session.user.role, tarefa.projeto.empresaId))) {
    return NextResponse.json({ error: "Sem acesso." }, { status: 403 });
  }
  const body = await req.json();
  const updated = await prisma.tarefa.update({
    where: { id },
    data: {
      titulo: body.titulo ?? tarefa.titulo,
      descricao: body.descricao ?? tarefa.descricao,
      status: body.status ?? tarefa.status,
      tag: body.tag ?? tarefa.tag,
      prazo: body.prazo === undefined ? tarefa.prazo : body.prazo ? new Date(body.prazo) : null,
      responsavelId: body.responsavelId === undefined ? tarefa.responsavelId : body.responsavelId || null,
    },
    include: { responsavel: true },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();
  const tarefa = await prisma.tarefa.findUnique({
    where: { id },
    include: { projeto: true },
  });
  if (!tarefa) return NextResponse.json({ error: "Não encontrada." }, { status: 404 });
  if (!(await podeAcessarEmpresa(session.user.id, session.user.role, tarefa.projeto.empresaId))) {
    return NextResponse.json({ error: "Sem acesso." }, { status: 403 });
  }
  await prisma.tarefa.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
