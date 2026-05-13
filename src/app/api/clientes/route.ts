import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, empresaIdsDoUsuario, podeAcessarEmpresa } from "@/lib/permissions";

const schema = z.object({
  nome: z.string().min(2),
  documento: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  telefone: z.string().optional().nullable(),
  observacao: z.string().optional().nullable(),
  empresaId: z.string(),
});

export async function GET(req: Request) {
  const session = await requireSession();
  const url = new URL(req.url);
  const empresaId = url.searchParams.get("empresaId");
  const ids = await empresaIdsDoUsuario(session.user.id, session.user.role);
  const where = empresaId ? { empresaId } : { empresaId: { in: ids } };
  const clientes = await prisma.cliente.findMany({
    where,
    include: { empresa: true },
    orderBy: { nome: "asc" },
  });
  return NextResponse.json(clientes);
}

export async function POST(req: Request) {
  const session = await requireSession();
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  if (!(await podeAcessarEmpresa(session.user.id, session.user.role, parsed.data.empresaId))) {
    return NextResponse.json({ error: "Sem acesso à empresa." }, { status: 403 });
  }
  const c = await prisma.cliente.create({
    data: {
      nome: parsed.data.nome,
      documento: parsed.data.documento || null,
      email: parsed.data.email || null,
      telefone: parsed.data.telefone || null,
      observacao: parsed.data.observacao || null,
      empresaId: parsed.data.empresaId,
    },
  });
  return NextResponse.json(c, { status: 201 });
}
