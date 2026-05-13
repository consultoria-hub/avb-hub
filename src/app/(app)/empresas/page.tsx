import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function EmpresasPage() {
  const session = (await getServerSession(authOptions))!;
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const empresas = await prisma.empresa.findMany({
    orderBy: { nome: "asc" },
    include: { _count: { select: { clientes: true, projetos: true, usuariosAcesso: true } } },
  });

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Empresas do grupo</h1>
        <p className="text-sm text-slate-500">Pré-cadastradas. Use a página de Usuários para conceder acessos.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {empresas.map((e) => (
          <div key={e.id} className="card p-5">
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full" style={{ background: e.cor }} />
              <h2 className="font-semibold">{e.nome}</h2>
            </div>
            <div className="text-xs text-slate-500 mt-1">slug: {e.slug}</div>
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              <div className="bg-slate-50 rounded p-2">
                <div className="text-lg font-bold">{e._count.clientes}</div>
                <div className="text-[11px] text-slate-500">clientes</div>
              </div>
              <div className="bg-slate-50 rounded p-2">
                <div className="text-lg font-bold">{e._count.projetos}</div>
                <div className="text-[11px] text-slate-500">projetos</div>
              </div>
              <div className="bg-slate-50 rounded p-2">
                <div className="text-lg font-bold">{e._count.usuariosAcesso}</div>
                <div className="text-[11px] text-slate-500">usuários</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
