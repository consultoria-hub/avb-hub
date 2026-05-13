import { getServerSession } from "next-auth";
import { authOptions, getEmpresasDoUsuario } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { empresaIdsDoUsuario } from "@/lib/permissions";
import ClientesClient from "./ClientesClient";

export default async function ClientesPage() {
  const session = (await getServerSession(authOptions))!;
  const empresas = await getEmpresasDoUsuario(session.user.id, session.user.role);
  const ids = await empresaIdsDoUsuario(session.user.id, session.user.role);
  const clientes = await prisma.cliente.findMany({
    where: { empresaId: { in: ids } },
    include: { empresa: true },
    orderBy: { nome: "asc" },
  });
  return (
    <ClientesClient
      empresas={empresas.map((e) => ({ id: e.id, nome: e.nome, cor: e.cor }))}
      clientesIniciais={clientes.map((c) => ({
        id: c.id,
        nome: c.nome,
        documento: c.documento,
        email: c.email,
        telefone: c.telefone,
        observacao: c.observacao,
        empresaId: c.empresaId,
        empresaNome: c.empresa.nome,
        empresaCor: c.empresa.cor,
      }))}
    />
  );
}
