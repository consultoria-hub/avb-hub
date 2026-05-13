import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, empresaIdsDoUsuario, podeAcessarEmpresa } from "@/lib/permissions";

const TAGS = ["FINANCEIRO", "ESTRATEGICO", "PESSOAS", "COMERCIAL"] as const;
const STATUS = ["A_FAZER", "EM_ANDAMENTO", "EM_REVISAO", "CONCLUIDO"] as const;

const schema = z.object({
  titulo: z.string().min(2),
  descricao: z.string().optional().nullable(),
  status: z.enum(STATUS).default("A_FAZER"),
  tag: z.enum(TAGS).default("ESTRATEGICO"),
  prazo: z.string().optional().nullable(),
  empresaId: z.string(),
  clienteId: z.string().optional().nullable(),
  responsavelId: z.string().optional().nullable(),
});

export async function GET(req: Request) {
  const session = await requireSession();
  const url = new URL(req.url);
  const empresaId = url.searchParams.get("empresaId");
  const ids = await empresaIdsDoUsuario(session.user.id, session.user.role);
  const where = empresaId ? { empresaId } : { empresaId: { in: ids } };
  const projetos = await prisma.projeto.findMany({
    where,
    include: { empresa: true, cliente: true, responsavel: true, tarefas: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(projetos);
}

export async function POST(req: Request) {
  const session = await requireSession();
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  if (!(await podeAcessarEmpresa(session.user.id, session.user.role, parsed.data.empresaId))) {
    return NextResponse.json({ error: "Sem acesso à empresa." }, { status: 403 });
  }
  const p = await prisma.projeto.create({
    data: {
      titulo: parsed.data.titulo,
      descricao: parsed.data.descricao || null,
      status: parsed.data.status,
      tag: parsed.data.tag,
      prazo: parsed.data.prazo ? new Date(parsed.data.prazo) : null,
      empresaId: parsed.data.empresaId,
      clienteId: parsed.data.clienteId || null,
      responsavelId: parsed.data.responsavelId || null,
    },
    include: { empresa: true, cliente: true, responsavel: true, tarefas: true },
  });
  return NextResponse.json(p, { status: 201 });
}
