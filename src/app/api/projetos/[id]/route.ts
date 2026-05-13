import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, podeAcessarEmpresa } from "@/lib/permissions";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await requireSession();
  const projeto = await prisma.projeto.findUnique({ where: { id: params.id } });
  if (!projeto) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  if (!(await podeAcessarEmpresa(session.user.id, session.user.role, projeto.empresaId))) {
    return NextResponse.json({ error: "Sem acesso." }, { status: 403 });
  }
  const body = await req.json();
  const updated = await prisma.projeto.update({
    where: { id: params.id },
    data: {
      titulo: body.titulo ?? projeto.titulo,
      descricao: body.descricao ?? projeto.descricao,
      status: body.status ?? projeto.status,
      tag: body.tag ?? projeto.tag,
      prazo: body.prazo === undefined ? projeto.prazo : body.prazo ? new Date(body.prazo) : null,
      clienteId: body.clienteId === undefined ? projeto.clienteId : body.clienteId || null,
      responsavelId: body.responsavelId === undefined ? projeto.responsavelId : body.responsavelId || null,
    },
    include: { empresa: true, cliente: true, responsavel: true, tarefas: true },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireSession();
  const projeto = await prisma.projeto.findUnique({ where: { id: params.id } });
  if (!projeto) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  if (!(await podeAcessarEmpresa(session.user.id, session.user.role, projeto.empresaId))) {
    return NextResponse.json({ error: "Sem acesso." }, { status: 403 });
  }
  await prisma.projeto.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
