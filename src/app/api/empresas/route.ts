import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, empresaIdsDoUsuario } from "@/lib/permissions";

export async function GET() {
  const session = await requireSession();
  const ids = await empresaIdsDoUsuario(session.user.id, session.user.role);
  const empresas = await prisma.empresa.findMany({
    where: { id: { in: ids } },
    orderBy: { nome: "asc" },
  });
  return NextResponse.json(empresas);
}
