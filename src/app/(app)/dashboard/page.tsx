import { getServerSession } from "next-auth";
import { authOptions, getEmpresasDoUsuario } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDuracao } from "@/lib/labels";

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

  // Relatório: tempo médio por cliente
  const clientes = await prisma.cliente.findMany({
    where: { empresaId: { in: empresaIds } },
    include: {
      empresa: true,
      projetos: {
        include: {
          tarefas: {
            include: { tempos: true },
          },
        },
      },
    },
  });

  const agora = Date.now();
  const tempoPorCliente = clientes
    .map((c) => {
      const tarefas = c.projetos.flatMap((p) => p.tarefas);
      let totalSegundos = 0;
      let tarefasComTempo = 0;
      for (const t of tarefas) {
        let s = 0;
        for (const tt of t.tempos) {
          if (tt.fim && tt.duracaoSegundos) s += tt.duracaoSegundos;
          else if (!tt.fim) s += Math.max(0, Math.floor((agora - new Date(tt.inicio).getTime()) / 1000));
        }
        if (s > 0) tarefasComTempo += 1;
        totalSegundos += s;
      }
      const mediaSegundos = tarefasComTempo > 0 ? Math.round(totalSegundos / tarefasComTempo) : 0;
      return {
        id: c.id,
        nome: c.nome,
        empresaNome: c.empresa.nome,
        empresaCor: c.empresa.cor,
        totalTarefas: tarefas.length,
        tarefasComTempo,
        totalSegundos,
        mediaSegundos,
      };
    })
    .sort((a, b) => b.totalSegundos - a.totalSegundos);

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
        <h2 className="font-semibold mb-1">Tempo médio por cliente</h2>
        <p className="text-xs text-slate-500 mb-3">
          Soma do tempo registrado pelo cronômetro em todas as tarefas de cada cliente, e a média por tarefa.
        </p>
        {tempoPorCliente.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum cliente cadastrado ainda.</p>
        ) : (
          <div className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
                <tr>
                  <th className="text-left px-3 py-2">Cliente</th>
                  <th className="text-left px-3 py-2">Empresa</th>
                  <th className="text-right px-3 py-2">Tarefas</th>
                  <th className="text-right px-3 py-2">Tempo total</th>
                  <th className="text-right px-3 py-2">Média por tarefa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tempoPorCliente.map((c) => (
                  <tr key={c.id}>
                    <td className="px-3 py-2 font-medium">{c.nome}</td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full" style={{ background: c.empresaCor }} />
                        {c.empresaNome}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-slate-600">
                      {c.tarefasComTempo} / {c.totalTarefas}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">{formatDuracao(c.totalSegundos)}</td>
                    <td className="px-3 py-2 text-right font-mono">
                      {c.tarefasComTempo > 0 ? formatDuracao(c.mediaSegundos) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

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
