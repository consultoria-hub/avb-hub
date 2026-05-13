"use client";
import { useState } from "react";
import Modal from "@/components/Modal";

type Empresa = { id: string; nome: string; cor: string };
type Cliente = {
  id: string;
  nome: string;
  documento: string | null;
  email: string | null;
  telefone: string | null;
  observacao: string | null;
  empresaId: string;
  empresaNome: string;
  empresaCor: string;
};

export default function ClientesClient({
  empresas,
  clientesIniciais,
}: {
  empresas: Empresa[];
  clientesIniciais: Cliente[];
}) {
  const [clientes, setClientes] = useState(clientesIniciais);
  const [filtro, setFiltro] = useState("");
  const [filtroEmpresa, setFiltroEmpresa] = useState("");
  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [form, setForm] = useState<Partial<Cliente>>({});
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function abrirNovo() {
    setEditando(null);
    setForm({ empresaId: empresas[0]?.id });
    setErro(null);
    setOpen(true);
  }
  function abrirEditar(c: Cliente) {
    setEditando(c);
    setForm(c);
    setErro(null);
    setOpen(true);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      if (editando) {
        const res = await fetch(`/api/clientes/${editando.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Erro ao salvar.");
        const updated = await res.json();
        const emp = empresas.find((e) => e.id === updated.empresaId);
        setClientes((cs) =>
          cs.map((c) =>
            c.id === updated.id
              ? { ...c, ...updated, empresaNome: emp?.nome || c.empresaNome, empresaCor: emp?.cor || c.empresaCor }
              : c,
          ),
        );
      } else {
        const res = await fetch("/api/clientes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Erro ao salvar.");
        const novo = await res.json();
        const emp = empresas.find((e) => e.id === novo.empresaId);
        setClientes((cs) => [
          { ...novo, empresaNome: emp?.nome || "", empresaCor: emp?.cor || "#999" },
          ...cs,
        ]);
      }
      setOpen(false);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(c: Cliente) {
    if (!confirm(`Excluir o cliente "${c.nome}"? Os projetos relacionados perderão o vínculo.`)) return;
    const res = await fetch(`/api/clientes/${c.id}`, { method: "DELETE" });
    if (res.ok) setClientes((cs) => cs.filter((x) => x.id !== c.id));
  }

  const visiveis = clientes.filter((c) => {
    if (filtroEmpresa && c.empresaId !== filtroEmpresa) return false;
    if (filtro && !`${c.nome} ${c.email ?? ""} ${c.documento ?? ""}`.toLowerCase().includes(filtro.toLowerCase()))
      return false;
    return true;
  });

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-sm text-slate-500">Base de clientes do grupo, por empresa.</p>
        </div>
        <button className="btn-primary" onClick={abrirNovo} disabled={empresas.length === 0}>
          + Novo cliente
        </button>
      </header>

      <div className="flex flex-wrap gap-3">
        <input
          className="input max-w-xs"
          placeholder="Buscar por nome, email, documento..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
        <select className="input max-w-xs" value={filtroEmpresa} onChange={(e) => setFiltroEmpresa(e.target.value)}>
          <option value="">Todas as empresas</option>
          {empresas.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Nome</th>
              <th className="text-left px-4 py-2">Empresa</th>
              <th className="text-left px-4 py-2">Contato</th>
              <th className="text-left px-4 py-2">Documento</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visiveis.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 font-medium">{c.nome}</td>
                <td className="px-4 py-2">
                  <span className="inline-flex items-center gap-2 text-xs">
                    <span className="inline-block w-2 h-2 rounded-full" style={{ background: c.empresaCor }} />
                    {c.empresaNome}
                  </span>
                </td>
                <td className="px-4 py-2 text-slate-600">
                  <div>{c.email || "—"}</div>
                  <div className="text-xs text-slate-400">{c.telefone || ""}</div>
                </td>
                <td className="px-4 py-2 text-slate-600">{c.documento || "—"}</td>
                <td className="px-4 py-2 text-right space-x-2 whitespace-nowrap">
                  <button className="text-brand-600 text-xs hover:underline" onClick={() => abrirEditar(c)}>
                    Editar
                  </button>
                  <button className="text-red-600 text-xs hover:underline" onClick={() => excluir(c)}>
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
            {visiveis.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">
                  Nenhum cliente encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editando ? "Editar cliente" : "Novo cliente"}>
        <form onSubmit={salvar} className="space-y-3">
          <div>
            <label className="label">Empresa *</label>
            <select
              className="input"
              value={form.empresaId || ""}
              onChange={(e) => setForm({ ...form, empresaId: e.target.value })}
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
            <label className="label">Nome *</label>
            <input className="input" value={form.nome || ""} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Documento</label>
              <input className="input" value={form.documento || ""} onChange={(e) => setForm({ ...form, documento: e.target.value })} />
            </div>
            <div>
              <label className="label">Telefone</label>
              <input className="input" value={form.telefone || ""} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Observação</label>
            <textarea className="input min-h-20" value={form.observacao || ""} onChange={(e) => setForm({ ...form, observacao: e.target.value })} />
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
