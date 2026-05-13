"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import {
  STATUSES,
  TAGS,
  statusLabel,
  tagLabel,
  tagClass,
  formatDate,
  isAtrasado,
  formatDuracao,
  formatCronometro,
  type Status,
  type Tag,
} from "@/lib/labels";

type ProjetoView = {
  id: string;
  titulo: string;
  descricao: string | null;
  status: string;
  tag: string;
  prazo: string | null;
  empresaNome: string;
  empresaCor: string;
  clienteNome: string | null;
  responsavelNome: string | null;
};

type TarefaView = {
  id: string;
  titulo: string;
  descricao: string | null;
  status: string;
  tag: string;
  prazo: string | null;
  responsavelId: string | null;
  responsavelNome: string | null;
  tempoTotalSegundos: number;
  timerInicio: string | null;
  timerUsuarioId: string | null;
};

export default function ProjetoDetalheClient({
  projeto,
  tarefasIniciais,
  usuarios,
  currentUserId,
}: {
  projeto: ProjetoView;
  tarefasIniciais: TarefaView[];
  usuarios: { id: string; nome: string }[];
  currentUserId: string;
}) {
  const [tarefas, setTarefas] = useState(tarefasIniciais);
  const [view, setView] = useState<"kanban" | "lista">("kanban");
  const [agora, setAgora] = useState<number>(Date.now());

  // Tick a cada segundo para atualizar cronômetros rodando
  useEffect(() => {
    const algumRodando = tarefas.some((t) => t.timerInicio);
    if (!algumRodando) return;
    const id = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(id);
  }, [tarefas]);

  function elapsedSegundos(t: TarefaView): number {
    const base = t.tempoTotalSegundos || 0;
    if (!t.timerInicio) return base;
    const extra = Math.max(0, Math.floor((agora - new Date(t.timerInicio).getTime()) / 1000));
    return base + extra;
  }

  async function iniciarTimer(t: TarefaView) {
    const res = await fetch(`/api/tarefas/${t.id}/timer/start`, { method: "POST" });
    if (!res.ok) return;
    const novo = await res.json();
    setTarefas((ts) =>
      ts.map((x) => {
        if (x.id === t.id) {
          return { ...x, timerInicio: novo.inicio, timerUsuarioId: novo.usuarioId };
        }
        // Para outros timers do mesmo usuário (foram fechados no backend)
        if (x.timerInicio && x.timerUsuarioId === currentUserId) {
          const extra = Math.max(0, Math.floor((Date.now() - new Date(x.timerInicio).getTime()) / 1000));
          return { ...x, timerInicio: null, timerUsuarioId: null, tempoTotalSegundos: x.tempoTotalSegundos + extra };
        }
        return x;
      }),
    );
  }

  async function pararTimer(t: TarefaView) {
    const res = await fetch(`/api/tarefas/${t.id}/timer/stop`, { method: "POST" });
    if (!res.ok) return;
    const fechado = await res.json();
    setTarefas((ts) =>
      ts.map((x) =>
        x.id === t.id
          ? { ...x, timerInicio: null, timerUsuarioId: null, tempoTotalSegundos: x.tempoTotalSegundos + (fechado.duracaoSegundos || 0) }
          : x,
      ),
    );
  }

  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState<TarefaView | null>(null);
  const [form, setForm] = useState<any>({});
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function abrirNovo() {
    setEditando(null);
    setErro(null);
    setForm({ titulo: "", descricao: "", status: "A_FAZER", tag: projeto.tag, prazo: "", responsavelId: "" });
    setOpen(true);
  }
  function abrirEditar(t: TarefaView) {
    setEditando(t);
    setErro(null);
    setForm({
      titulo: t.titulo,
      descricao: t.descricao || "",
      status: t.status,
      tag: t.tag,
      prazo: t.prazo ? t.prazo.slice(0, 10) : "",
      responsavelId: t.responsavelId || "",
    });
    setOpen(true);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      const payload = {
        ...form,
        prazo: form.prazo || null,
        responsavelId: form.responsavelId || null,
        projetoId: projeto.id,
      };
      const res = await fetch(editando ? `/api/tarefas/${editando.id}` : "/api/tarefas", {
        method: editando ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Erro ao salvar.");
      const saved = await res.json();
      const resp = usuarios.find((u) => u.id === saved.responsavelId);
      const anterior = editando ? tarefas.find((t) => t.id === editando.id) : null;
      const v: TarefaView = {
        id: saved.id,
        titulo: saved.titulo,
        descricao: saved.descricao,
        status: saved.status,
        tag: saved.tag,
        prazo: saved.prazo ?? null,
        responsavelId: saved.responsavelId,
        responsavelNome: saved.responsavel?.nome ?? resp?.nome ?? null,
        tempoTotalSegundos: anterior?.tempoTotalSegundos ?? 0,
        timerInicio: anterior?.timerInicio ?? null,
        timerUsuarioId: anterior?.timerUsuarioId ?? null,
      };
      setTarefas((ts) => (editando ? ts.map((t) => (t.id === v.id ? v : t)) : [v, ...ts]));
      setOpen(false);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(t: TarefaView) {
    if (!confirm(`Excluir a tarefa "${t.titulo}"?`)) return;
    const res = await fetch(`/api/tarefas/${t.id}`, { method: "DELETE" });
    if (res.ok) setTarefas((ts) => ts.filter((x) => x.id !== t.id));
  }

  async function mudarStatus(t: TarefaView, status: string) {
    const res = await fetch(`/api/tarefas/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) setTarefas((ts) => ts.map((x) => (x.id === t.id ? { ...x, status } : x)));
  }

  return (
    <div className="space-y-5">
      <div className="text-sm">
        <Link href="/projetos" className="text-slate-500 hover:text-brand-600">
          ← Voltar para projetos
        </Link>
      </div>

      <header className="card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 text-xs">
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: projeto.empresaCor }} />
              <span className="text-slate-500">{projeto.empresaNome}</span>
              <span className={tagClass[projeto.tag as Tag]}>{tagLabel[projeto.tag as Tag]}</span>
              <span className="text-slate-500">· {statusLabel[projeto.status as Status]}</span>
            </div>
            <h1 className="text-2xl font-bold">{projeto.titulo}</h1>
            {projeto.descricao && <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{projeto.descricao}</p>}
          </div>
          <div className="text-right text-sm text-slate-600 shrink-0">
            <div>Cliente: <b>{projeto.clienteNome || "—"}</b></div>
            <div>Responsável: <b>{projeto.responsavelNome || "—"}</b></div>
            <div className={isAtrasado(projeto.prazo, projeto.status) ? "text-red-600 font-medium" : ""}>
              Prazo: <b>{formatDate(projeto.prazo)}</b>
            </div>
          </div>
        </div>
      </header>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tarefas</h2>
        <div className="flex gap-2">
          <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5">
            <button
              className={`px-3 py-1.5 text-sm rounded ${view === "kanban" ? "bg-brand-600 text-white" : "text-slate-600"}`}
              onClick={() => setView("kanban")}
            >
              Kanban
            </button>
            <button
              className={`px-3 py-1.5 text-sm rounded ${view === "lista" ? "bg-brand-600 text-white" : "text-slate-600"}`}
              onClick={() => setView("lista")}
            >
              Lista
            </button>
          </div>
          <button className="btn-primary" onClick={abrirNovo}>
            + Nova tarefa
          </button>
        </div>
      </div>

      {view === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {STATUSES.map((s) => {
            const col = tarefas.filter((t) => t.status === s);
            return (
              <div key={s} className="bg-slate-100 rounded-lg p-2 min-h-[180px]">
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-xs font-semibold text-slate-600 uppercase">{statusLabel[s]}</span>
                  <span className="text-xs text-slate-500">{col.length}</span>
                </div>
                <div className="space-y-2 mt-1">
                  {col.map((t) => {
                    const rodando = !!t.timerInicio;
                    const segs = elapsedSegundos(t);
                    return (
                      <div key={t.id} className="card p-3 cursor-pointer hover:shadow" onClick={() => abrirEditar(t)}>
                        <div className="flex justify-between items-center mb-1">
                          <span className={tagClass[t.tag as Tag]}>{tagLabel[t.tag as Tag]}</span>
                        </div>
                        <div className="text-sm font-medium">{t.titulo}</div>
                        <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                          <span>{t.responsavelNome || "—"}</span>
                          <span className={isAtrasado(t.prazo, t.status) ? "text-red-600 font-medium" : ""}>
                            {formatDate(t.prazo)}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-2 text-xs" onClick={(e) => e.stopPropagation()}>
                          <span className={`font-mono ${rodando ? "text-emerald-700 font-semibold" : "text-slate-500"}`}>
                            {rodando ? "⏱ " : ""}{formatCronometro(segs)}
                          </span>
                          {rodando ? (
                            <button
                              className="px-2 py-0.5 rounded bg-red-100 text-red-700 hover:bg-red-200 text-[11px] font-medium"
                              onClick={() => pararTimer(t)}
                            >
                              ■ Parar
                            </button>
                          ) : (
                            <button
                              className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-[11px] font-medium"
                              onClick={() => iniciarTimer(t)}
                            >
                              ▶ Iniciar
                            </button>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
                          {STATUSES.filter((x) => x !== s).map((x) => (
                            <button
                              key={x}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                              onClick={() => mudarStatus(t, x)}
                            >
                              → {statusLabel[x]}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {col.length === 0 && <div className="text-xs text-slate-400 px-2 py-3 text-center">Vazio</div>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-2">Tarefa</th>
                <th className="text-left px-4 py-2">Tag</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-left px-4 py-2">Responsável</th>
                <th className="text-left px-4 py-2">Prazo</th>
                <th className="text-left px-4 py-2">Tempo</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tarefas.map((t) => {
                const rodando = !!t.timerInicio;
                const segs = elapsedSegundos(t);
                return (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-medium">{t.titulo}</td>
                    <td className="px-4 py-2">
                      <span className={tagClass[t.tag as Tag]}>{tagLabel[t.tag as Tag]}</span>
                    </td>
                    <td className="px-4 py-2 text-xs">{statusLabel[t.status as Status]}</td>
                    <td className="px-4 py-2 text-slate-600">{t.responsavelNome || "—"}</td>
                    <td className={`px-4 py-2 text-xs ${isAtrasado(t.prazo, t.status) ? "text-red-600 font-medium" : "text-slate-600"}`}>
                      {formatDate(t.prazo)}
                    </td>
                    <td className="px-4 py-2 text-xs whitespace-nowrap">
                      <span className={`font-mono ${rodando ? "text-emerald-700 font-semibold" : "text-slate-600"}`}>
                        {rodando ? "⏱ " : ""}{formatCronometro(segs)}
                      </span>
                      {rodando ? (
                        <button className="ml-2 text-[11px] text-red-600 hover:underline" onClick={() => pararTimer(t)}>
                          parar
                        </button>
                      ) : (
                        <button className="ml-2 text-[11px] text-emerald-700 hover:underline" onClick={() => iniciarTimer(t)}>
                          iniciar
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right space-x-2 whitespace-nowrap">
                      <button className="text-brand-600 text-xs hover:underline" onClick={() => abrirEditar(t)}>
                        Editar
                      </button>
                      <button className="text-red-600 text-xs hover:underline" onClick={() => excluir(t)}>
                        Excluir
                      </button>
                    </td>
                  </tr>
                );
              })}
              {tarefas.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-sm">
                    Nenhuma tarefa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editando ? "Editar tarefa" : "Nova tarefa"} maxWidth="max-w-lg">
        <form onSubmit={salvar} className="space-y-3">
          <div>
            <label className="label">Título *</label>
            <input className="input" value={form.titulo || ""} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Tag</label>
              <select className="input" value={form.tag || projeto.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })}>
                {TAGS.map((t) => (
                  <option key={t} value={t}>
                    {tagLabel[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status || "A_FAZER"} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {statusLabel[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Prazo</label>
              <input type="date" className="input" value={form.prazo || ""} onChange={(e) => setForm({ ...form, prazo: e.target.value })} />
            </div>
            <div>
              <label className="label">Responsável</label>
              <select className="input" value={form.responsavelId || ""} onChange={(e) => setForm({ ...form, responsavelId: e.target.value })}>
                <option value="">— ninguém —</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Descrição</label>
            <textarea className="input min-h-24" value={form.descricao || ""} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
          </div>
          {erro && <div className="text-sm text-red-600">{erro}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>
              Cancelar
            </button>
            <button className="btn-primary" disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
