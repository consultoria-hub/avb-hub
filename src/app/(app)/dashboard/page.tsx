import { getServerSession } from "next-auth";
import { authOptions, getEmpresasDoUsuario } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = (await getServerSession(authOptions))!;
  const empresas = await getEmpresasDoUsuario(session.user.id, session.user.role);
  const empresaIds = empresas.map((e) => e.id);

  const [totalProjetos, totalClientes, totalTarefas, tarefasAtrasadas] = await Promise.all([
    prisma.projeto.count({ where: { empresaId: { in: empresaIds } } }),
    prisma.cliente.count({ where: { empresaId: { in: empresaIds } } }),
    prisma.tarefa.count({ where: { projeto: { empresaId: { in: empresaIds } } } }),
    prisma.tarefa.count({
      where: {
        projeto: { empresaId: { in: empresaIds } },
        prazo: { lt: new Date() },
        status: { not: "CONCLUIDO" },
      },
    }),
  ]);

  const proximas = await prisma.tarefa.findMany({
    where: {
      projeto: { empresaId: { in: empresaIds } },
      status: { not: "CONCLUIDO" },
      prazo: { not: null },
    },
    include: { projeto: { include: { empresa: true } }, responsavel: true },
    orderBy: { prazo: "asc" },
    take: 8,
  });

  const cards = [
    { label: "Projetos ativos", value: totalProjetos, color: "bg-brand-50 text-brand-700" },
    { label: "Clientes", value: totalClientes, color: "bg-emerald-50 text-emerald-700" },
    { label: "Tarefas", value: totalTarefas, color: "bg-indigo-50 text-indigo-700" },
    { label: "Tarefas atrasadas", value: tarefasAtrasadas, color: "bg-rose-50 text-rose-700" },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Bem-vindo, {session.user.name?.split(" ")[0]}</h1>
        <p className="text-sm text-slate-500">Visão geral das empresas que você tem acesso.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-4">
            <div className={`text-xs font-medium inline-block px-2 py-0.5 rounded ${c.color}`}>{c.label}</div>
            <div className="text-3xl font-bold mt-3">{c.value}</div>
          </div>
        ))}
      </div>

      <section className="card p-5">
        <h2 className="font-semibold mb-3">Próximas tarefas</h2>
        {proximas.length === 0 ? (
          <p className="text-sm text-slate-500">Nada na agenda.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {proximas.map((t) => (
              <li key={t.id} className="py-2 flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">{t.titulo}</div>
                  <div className="text-xs text-slate-500">
                    {t.projeto.empresa.nome} · {t.projeto.titulo}
                    {t.responsavel ? ` · ${t.responsavel.nome}` : ""}
                  </div>
                </div>
                <div className="text-xs text-slate-600">
                  {t.prazo ? new Date(t.prazo).toLocaleDateString("pt-BR") : "—"}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
