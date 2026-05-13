import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  senha: z.string().min(6),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }
  const { nome, email, senha } = parsed.data;
  const existente = await prisma.usuario.findUnique({ where: { email: email.toLowerCase() } });
  if (existente) {
    return NextResponse.json({ error: "Email já cadastrado." }, { status: 409 });
  }
  const senhaHash = await bcrypt.hash(senha, 10);
  await prisma.usuario.create({
    data: { nome, email: email.toLowerCase(), senhaHash, role: "COLABORADOR" },
  });
  return NextResponse.json({ ok: true });
}
