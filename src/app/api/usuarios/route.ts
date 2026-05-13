import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requireAdmin } from "@/lib/permissions";

export async function GET() {
  const session = await requireSession();
  if (session.user.role === "ADMIN") {
    const usuarios = await prisma.usuario.findMany({
      include: { empresas: { include: { empresa: true } } },
      orderBy: { nome: "asc" },
    });
    return NextResponse.json(usuarios);
  }
  const usuarios = await prisma.usuario.findMany({
    where: { ativo: true },
    select: { id: true, nome: true, email: true, role: true },
    orderBy: { nome: "asc" },
  });
  return NextResponse.json(usuarios);
}

export async function POST(req: Request) {
  await requireAdmin();
  const body = await req.json();
  const usuarioId = body.usuarioId as string;
  const role = body.role as string | undefined;
  const ativo = body.ativo as boolean | undefined;
  const empresaIds = (body.empresaIds as string[]) || [];

  if (!usuarioId) return NextResponse.json({ error: "usuarioId obrigatório." }, { status: 400 });

  const data: any = {};
  if (role) data.role = role;
  if (typeof ativo === "boolean") data.ativo = ativo;
  await prisma.usuario.update({ where: { id: usuarioId }, data });

  await prisma.usuarioEmpresa.deleteMany({ where: { usuarioId } });
  if (empresaIds.length) {
    await prisma.usuarioEmpresa.createMany({
      data: empresaIds.map((empresaId) => ({ usuarioId, empresaId })),
    });
  }
  return NextResponse.json({ ok: true });
}
