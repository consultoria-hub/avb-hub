"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import Modal from "@/components/Modal";
import { STATUSES, TAGS, statusLabel, tagLabel, tagClass, formatDate, isAtrasado, type Status, type Tag } from "@/lib/labels";

type Empresa = { id: string; nome: string; cor: string };
type Cliente = { id: string; nome: string; empresaId: string };
type Usuario = { id: string; nome: string; role: string };

type ProjetoView = {
  id: string;
  titulo: string;
  descricao: string | null;
  status: string;
  tag: string;
  prazo: string | null;
  empresaId: string;
  empresaNome: string;
  empresaCor: string;
  clienteId: string | null;
  clienteNome: string | null;
  responsavelId: string | null;
  responsavelNome: string | null;
  totalTarefas: number;
  tarefasConcluidas: number;
};

export default function ProjetosClient({
  empresas,
  clientes,
  usuarios,
  projetosIniciais,
}: {
  empresas: Empresa[];
  clientes: Cliente[];
  usuarios: Usuario[];
  projetosIniciais: ProjetoView[];
}) {
  const [projetos, setProjetos] = useState(projetosIniciais);
  const [view, setView] = useState<"kanban" | "lista">("kanban");
  const [filtroEmpresa, setFiltroEmpresa] = useState("");
  const [filtroTag, setFiltroTag] = useState("");
  const [filtroResp, setFiltroResp] = useState("");
  const [busca, setBusca] = useState("");

  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState<ProjetoView | null>(null);
  const [form, setForm] = useState<any>({});
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function abrirNovo() {
    setEditando(null);
    setErro(null);
    setForm({
      titulo: "",
      descricao: "",
      status: "A_FAZER",
      tag: "ESTRATEGICO",
      prazo: "",
      empresaId: empresas[0]?.id || "",
      clienteId: "",
      responsavelId: "",
    });
    setOpen(true);
  }
  function abrirEditar(p: ProjetoView) {
    setEditando(p);
    setErro(null);
    setForm({
      titulo: p.titulo,
      descricao: p.descricao || "",
      status: p.status,
      tag: p.tag,
      prazo: p.prazo ? p.prazo.slice(0, 10) : "",
      empresaId: p.empresaId,
      clienteId: p.clienteId || "",
      responsavelId: p.responsavelId || "",
    });
    setOpen(true);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      const payload = { ...form, prazo: form.prazo || null, clienteId: form.clienteId || null, responsavelId: form.responsavelId || null };
      const res = await fetch(editando ? `/api/projetos/${editando.id}` : "/api/projetos", {
        method: editando ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Erro ao salvar.");
      const saved = await res.json();
      const view = projetoToView(saved, empresas, usuarios);
      setProjetos((ps) => (editando ? ps.map((p) => (p.id === view.id ? view : p)) : [view, ...ps]));
      setOpen(false);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(p: ProjetoView) {
    if (!confirm(`Excluir o projeto "${p.titulo}"? Todas as tarefas serão removidas.`)) return;
    const res = await fetch(`/api/projetos/${p.id}`, { method: "DELETE" });
    if (res.ok) setProjetos((ps) => ps.filter((x) => x.id !== p.id));
  }

  async function mudarStatus(p: ProjetoView, status: string) {
    const res = await fetch(`/api/projetos/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setProjetos((ps) => ps.map((x) => (x.id === p.id ? { ...x, status: updated.status } : x)));
    }
  }

  const visiveis = useMemo(() => {
    return projetos.filter((p) => {
      if (filtroEmpresa && p.empresaId !== filtroEmpresa) return false;
      if (filtroTag && p.tag !== filtroTag) return false;
      if (filtroResp && p.responsavelId !== filtroResp) return false;
      if (busca && !`${p.titulo} ${p.clienteNome ?? ""}`.toLowerCase().includes(busca.toLowerCase())) return false;
      return true;
    });
  }, [projetos, filtroEmpresa, filtroTag, filtroResp, busca]);

  const clientesEmpresaForm = clientes.filter((c) => c.empresaId === form.empresaId);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Projetos</h1>
          <p className="text-sm text-slate-500">Acompanhe os projetos do grupo em kanban ou lista.</p>
        </div>
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
          <button className="btn-primary" onClick={abrirNovo} disabled={empresas.length === 0}>
            + Novo projeto
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <input className="input" placeholder="Buscar..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        <select className="input" value={filtroEmpresa} onChange={(e) => setFiltroEmpresa(e.target.value)}>
          <option value="">Todas as empresas</option>
          {empresas.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nome}
            </option>
          ))}
        </select>
        <select className="input" value={filtroTag} onChange={(e) => setFiltroTag(e.target.value)}>
          <option value="">Todas as áreas</option>
          {TAGS.map((t) => (
            <option key={t} value={t}>
              {tagLabel[t]}
            </option>
          ))}
        </select>
        <select className="input" value={filtroResp} onChange={(e) => setFiltroResp(e.target.value)}>
          <option value="">Todos os responsáveis</option>
          {usuarios.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nome}
            </option>
          ))}
        </select>
      </div>

      {view === "kanban" ? (
        <Kanban projetos={visiveis} onClick={abrirEditar} onMover={mudarStatus} />
      ) : (
        <Lista projetos={visiveis} onEdit={abrirEditar} onDelete={excluir} />
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editando ? "Editar projeto" : "Novo projeto"} maxWidth="max-w-xl">
        <form onSubmit={salvar} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Título *</label>
              <input className="input" value={form.titulo || ""} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required />
            </div>
            <div>
              <label className="label">Empresa *</label>
              <select
                className="input"
                value={form.empresaId || ""}
                onChange={(e) => setForm({ ...form, empresaId: e.target.value, clienteId: "" })}
                required
                disabled={!!editando}
              >
                <option value="">Selecione</option>
                {empresas.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Cliente</label>
              <select
                className="input"
                value={form.clienteId || ""}
                onChange={(e) => setForm({ ...form, clienteId: e.target.value })}
              >
                <option value="">— sem cliente —</option>
                {clientesEmpresaForm.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Área (tag) *</label>
              <select className="input" value={form.tag || "ESTRATEGICO"} onChange={(e) => setForm({ ...form, tag: e.target.value })}>
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
              <select
                className="input"
                value={form.responsavelId || ""}
                onChange={(e) => setForm({ ...form, responsavelId: e.target.value })}
              >
                <option value="">— ninguém —</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Descrição</label>
              <textarea
                className="input min-h-24"
                value={form.descricao || ""}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              />
            </div>
          </div>
          {erro && <div className="text-sm text-red-600">{erro}</div>}
          <div className="flex justify-between items-center pt-2">
            <div>
              {editando && (
                <Link href={`/projetos/${editando.id}`} className="text-sm text-brand-600 hover:underline">
                  Abrir tarefas →
                </Link>
              )}
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>
                Cancelar
              </button>
              <button className="btn-primary" disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function projetoToView(saved: any, empresas: Empresa[], usuarios: Usuario[]): ProjetoView {
  const emp = empresas.find((e) => e.id === saved.empresaId);
  const resp = usuarios.find((u) => u.id === saved.responsavelId);
  return {
    id: saved.id,
    titulo: saved.titulo,
    descricao: saved.descricao,
    status: saved.status,
    tag: saved.tag,
    prazo: saved.prazo ?? null,
    empresaId: saved.empresaId,
    empresaNome: emp?.nome || saved.empresa?.nome || "",
    empresaCor: emp?.cor || saved.empresa?.cor || "#999",
    clienteId: saved.clienteId,
    clienteNome: saved.cliente?.nome ?? null,
    responsavelId: saved.responsavelId,
    responsavelNome: resp?.nome ?? saved.responsavel?.nome ?? null,
    totalTarefas: (saved.tarefas || []).length,
    tarefasConcluidas: (saved.tarefas || []).filter((t: any) => t.status === "CONCLUIDO").length,
  };
}

function Kanban({
  projetos,
  onClick,
  onMover,
}: {
  projetos: ProjetoView[];
  onClick: (p: ProjetoView) => void;
  onMover: (p: ProjetoView, status: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {STATUSES.map((s) => {
        const col = projetos.filter((p) => p.status === s);
        return (
          <div key={s} className="bg-slate-100 rounded-lg p-2 min-h-[200px]">
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-xs font-semibold text-slate-600 uppercase">{statusLabel[s]}</span>
              <span className="text-xs text-slate-500">{col.length}</span>
            </div>
            <div className="space-y-2 mt-1">
              {col.map((p) => (
                <div key={p.id} className="card p-3 cursor-pointer hover:shadow" onClick={() => onClick(p)}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={tagClass[p.tag as Tag]}>{tagLabel[p.tag as Tag]}</span>
                    <span className="inline-block w-2 h-2 rounded-full" style={{ background: p.empresaCor }} title={p.empresaNome} />
                  </div>
                  <div className="font-medium text-sm leading-snug">{p.titulo}</div>
                  {p.clienteNome && <div className="text-xs text-slate-500 mt-0.5">{p.clienteNome}</div>}
                  <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                    <span>{p.responsavelNome || "Sem responsável"}</span>
                    <span className={isAtrasado(p.prazo, p.status) ? "text-red-600 font-medium" : ""}>
                      {formatDate(p.prazo)}
                    </span>
                  </div>
                  {p.totalTarefas > 0 && (
                    <div className="mt-2 text-[11px] text-slate-500">
                      {p.tarefasConcluidas}/{p.totalTarefas} tarefas
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
                    {STATUSES.filter((x) => x !== s).map((x) => (
                      <button
                        key={x}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                        onClick={() => onMover(p, x)}
                      >
                        → {statusLabel[x]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {col.length === 0 && <div className="text-xs text-slate-400 px-2 py-3 text-center">Vazio</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Lista({
  projetos,
  onEdit,
  onDelete,
}: {
  projetos: ProjetoView[];
  onEdit: (p: ProjetoView) => void;
  onDelete: (p: ProjetoView) => void;
}) {
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
          <tr>
            <th className="text-left px-4 py-2">Projeto</th>
            <th className="text-left px-4 py-2">Empresa</th>
            <th className="text-left px-4 py-2">Cliente</th>
            <th className="text-left px-4 py-2">Tag</th>
            <th className="text-left px-4 py-2">Status</th>
            <th className="text-left px-4 py-2">Responsável</th>
            <th className="text-left px-4 py-2">Prazo</th>
            <th className="text-left px-4 py-2">Tarefas</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {projetos.map((p) => (
            <tr key={p.id} className="hover:bg-slate-50">
              <td className="px-4 py-2">
                <Link href={`/projetos/${p.id}`} className="font-medium hover:text-brand-600">
                  {p.titulo}
                </Link>
              </td>
              <td className="px-4 py-2 text-xs">
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full" style={{ background: p.empresaCor }} />
                  {p.empresaNome}
                </span>
              </td>
              <td className="px-4 py-2 text-slate-600">{p.clienteNome || "—"}</td>
              <td className="px-4 py-2">
                <span className={tagClass[p.tag as Tag]}>{tagLabel[p.tag as Tag]}</span>
              </td>
              <td className="px-4 py-2 text-xs text-slate-600">{statusLabel[p.status as Status]}</td>
              <td className="px-4 py-2 text-slate-600">{p.responsavelNome || "—"}</td>
              <td className={`px-4 py-2 text-xs ${isAtrasado(p.prazo, p.status) ? "text-red-600 font-medium" : "text-slate-600"}`}>
                {formatDate(p.prazo)}
              </td>
              <td className="px-4 py-2 text-xs text-slate-600">
                {p.tarefasConcluidas}/{p.totalTarefas}
              </td>
              <td className="px-4 py-2 text-right space-x-2 whitespace-nowrap">
                <button className="text-brand-600 text-xs hover:underline" onClick={() => onEdit(p)}>
                  Editar
                </button>
                <Link className="text-slate-600 text-xs hover:underline" href={`/projetos/${p.id}`}>
                  Tarefas
                </Link>
                <button className="text-red-600 text-xs hover:underline" onClick={() => onDelete(p)}>
                  Excluir
                </button>
              </td>
            </tr>
          ))}
          {projetos.length === 0 && (
            <tr>
              <td colSpan={9} className="px-4 py-8 text-center text-slate-400 text-sm">
                Nenhum projeto encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
