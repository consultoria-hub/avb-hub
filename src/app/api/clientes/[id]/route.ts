import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, podeAcessarEmpresa } from "@/lib/permissions";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await requireSession();
  const cliente = await prisma.cliente.findUnique({ where: { id: params.id } });
  if (!cliente) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  if (!(await podeAcessarEmpresa(session.user.id, session.user.role, cliente.empresaId))) {
    return NextResponse.json({ error: "Sem acesso." }, { status: 403 });
  }
  const body = await req.json();
  const updated = await prisma.cliente.update({
    where: { id: params.id },
    data: {
      nome: body.nome ?? cliente.nome,
      documento: body.documento ?? cliente.documento,
      email: body.email ?? cliente.email,
      telefone: body.telefone ?? cliente.telefone,
      observacao: body.observacao ?? cliente.observacao,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireSession();
  const cliente = await prisma.cliente.findUnique({ where: { id: params.id } });
  if (!cliente) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  if (!(await podeAcessarEmpresa(session.user.id, session.user.role, cliente.empresaId))) {
    return NextResponse.json({ error: "Sem acesso." }, { status: 403 });
  }
  await prisma.cliente.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
