import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

const schema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  senha: z.string().min(6),
  role: z.enum(["ADMIN", "GERENTE", "COLABORADOR"]).default("COLABORADOR"),
  empresaIds: z.array(z.string()).default([]),
});

export async function POST(req: Request) {
  await requireAdmin();
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }
  const { nome, email, senha, role, empresaIds } = parsed.data;
  const emailLower = email.toLowerCase();

  const existente = await prisma.usuario.findUnique({ where: { email: emailLower } });
  if (existente) {
    return NextResponse.json({ error: "Email já cadastrado." }, { status: 409 });
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  const novo = await prisma.usuario.create({
    data: {
      nome,
      email: emailLower,
      senhaHash,
      role,
      empresas: empresaIds.length
        ? { create: empresaIds.map((empresaId) => ({ empresaId })) }
        : undefined,
    },
    include: { empresas: { select: { empresaId: true } } },
  });

  return NextResponse.json(
    {
      id: novo.id,
      nome: novo.nome,
      email: novo.email,
      role: novo.role,
      ativo: novo.ativo,
      empresaIds: novo.empresas.map((e) => e.empresaId),
    },
    { status: 201 },
  );
}
