import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, podeAcessarEmpresa } from "@/lib/permissions";

const schema = z.object({
  titulo: z.string().min(2),
  descricao: z.string().optional().nullable(),
  status: z.string().default("A_FAZER"),
  tag: z.string().default("ESTRATEGICO"),
  prazo: z.string().optional().nullable(),
  projetoId: z.string(),
  responsavelId: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const session = await requireSession();
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  const projeto = await prisma.projeto.findUnique({ where: { id: parsed.data.projetoId } });
  if (!projeto) return NextResponse.json({ error: "Projeto não encontrado." }, { status: 404 });
  if (!(await podeAcessarEmpresa(session.user.id, session.user.role, projeto.empresaId))) {
    return NextResponse.json({ error: "Sem acesso." }, { status: 403 });
  }
  const t = await prisma.tarefa.create({
    data: {
      titulo: parsed.data.titulo,
      descricao: parsed.data.descricao || null,
      status: parsed.data.status,
      tag: parsed.data.tag,
      prazo: parsed.data.prazo ? new Date(parsed.data.prazo) : null,
      projetoId: parsed.data.projetoId,
      responsavelId: parsed.data.responsavelId || null,
    },
    include: { responsavel: true },
  });
  return NextResponse.json(t, { status: 201 });
}
