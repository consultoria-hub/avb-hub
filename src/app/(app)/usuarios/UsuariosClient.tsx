"use client";
import { useState } from "react";
import Modal from "@/components/Modal";
import { ROLES, roleLabel, type Role } from "@/lib/labels";

type Empresa = { id: string; nome: string; cor: string };
type Usuario = {
  id: string;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
  empresaIds: string[];
};

export default function UsuariosClient({
  empresas,
  usuariosIniciais,
}: {
  empresas: Empresa[];
  usuariosIniciais: Usuario[];
}) {
  const [usuarios, setUsuarios] = useState(usuariosIniciais);
  const [busca, setBusca] = useState("");
  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [form, setForm] = useState<{ role: string; ativo: boolean; empresaIds: string[] }>({
    role: "COLABORADOR",
    ativo: true,
    empresaIds: [],
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Criar usuário
  const [openCriar, setOpenCriar] = useState(false);
  const [criarForm, setCriarForm] = useState<{
    nome: string;
    email: string;
    senha: string;
    role: string;
    empresaIds: string[];
  }>({ nome: "", email: "", senha: "", role: "COLABORADOR", empresaIds: [] });
  const [criarSalvando, setCriarSalvando] = useState(false);
  const [criarErro, setCriarErro] = useState<string | null>(null);

  function abrirEditar(u: Usuario) {
    setEditando(u);
    setErro(null);
    setForm({ role: u.role, ativo: u.ativo, empresaIds: [...u.empresaIds] });
    setOpen(true);
  }

  function abrirCriar() {
    setCriarErro(null);
    setCriarForm({ nome: "", email: "", senha: "", role: "COLABORADOR", empresaIds: [] });
    setOpenCriar(true);
  }

  function toggleEmpresaCriar(id: string) {
    setCriarForm((f) =>
      f.empresaIds.includes(id)
        ? { ...f, empresaIds: f.empresaIds.filter((x) => x !== id) }
        : { ...f, empresaIds: [...f.empresaIds, id] },
    );
  }

  async function criarUsuario(e: React.FormEvent) {
    e.preventDefault();
    setCriarSalvando(true);
    setCriarErro(null);
    try {
      const res = await fetch("/api/usuarios/criar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(criarForm),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Erro ao criar.");
      const novo = await res.json();
      setUsuarios((us) => [novo, ...us]);
      setOpenCriar(false);
    } catch (e: any) {
      setCriarErro(e.message);
    } finally {
      setCriarSalvando(false);
    }
  }

  function toggleEmpresa(id: string) {
    setForm((f) =>
      f.empresaIds.includes(id) ? { ...f, empresaIds: f.empresaIds.filter((x) => x !== id) } : { ...f, empresaIds: [...f.empresaIds, id] },
    );
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!editando) return;
    setSalvando(true);
    setErro(null);
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuarioId: editando.id, ...form }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Erro ao salvar.");
      setUsuarios((us) =>
        us.map((u) => (u.id === editando.id ? { ...u, role: form.role, ativo: form.ativo, empresaIds: [...form.empresaIds] } : u)),
      );
      setOpen(false);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  const visiveis = usuarios.filter(
    (u) => !busca || `${u.nome} ${u.email}`.toLowerCase().includes(busca.toLowerCase()),
  );

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Usuários</h1>
          <p className="text-sm text-slate-500">Defina perfil de acesso e quais empresas cada usuário pode visualizar.</p>
        </div>
        <button className="btn-primary" onClick={abrirCriar}>
          + Criar usuário
        </button>
      </header>

      <input className="input max-w-sm" placeholder="Buscar..." value={busca} onChange={(e) => setBusca(e.target.value)} />

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Nome</th>
              <th className="text-left px-4 py-2">Email</th>
              <th className="text-left px-4 py-2">Perfil</th>
              <th className="text-left px-4 py-2">Empresas</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visiveis.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 font-medium">{u.nome}</td>
                <td className="px-4 py-2 text-slate-600">{u.email}</td>
                <td className="px-4 py-2">
                  <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">{roleLabel[u.role as Role]}</span>
                </td>
                <td className="px-4 py-2">
                  <div className="flex flex-wrap gap-1">
                    {u.role === "ADMIN" ? (
                      <span className="text-xs text-slate-500 italic">todas (admin)</span>
                    ) : u.empresaIds.length === 0 ? (
                      <span className="text-xs text-slate-400">— nenhuma —</span>
                    ) : (
                      u.empresaIds.map((id) => {
                        const e = empresas.find((x) => x.id === id);
                        if (!e) return null;
                        return (
                          <span key={id} className="inline-flex items-center gap-1 text-xs bg-slate-100 px-2 py-0.5 rounded">
                            <span className="inline-block w-2 h-2 rounded-full" style={{ background: e.cor }} />
                            {e.nome}
                          </span>
                        );
                      })
                    )}
                  </div>
                </td>
                <td className="px-4 py-2 text-xs">
                  {u.ativo ? (
                    <span className="text-emerald-600">● Ativo</span>
                  ) : (
                    <span className="text-slate-400">● Inativo</span>
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  <button className="text-brand-600 text-xs hover:underline" onClick={() => abrirEditar(u)}>
                    Editar permissões
                  </button>
                </td>
              </tr>
            ))}
            {visiveis.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">
                  Nenhum usuário.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={openCriar} onClose={() => setOpenCriar(false)} title="Criar novo usuário">
        <form onSubmit={criarUsuario} className="space-y-3">
          <div>
            <label className="label">Nome *</label>
            <input className="input" value={criarForm.nome} onChange={(e) => setCriarForm({ ...criarForm, nome: e.target.value })} required />
          </div>
          <div>
            <label className="label">Email *</label>
            <input className="input" type="email" value={criarForm.email} onChange={(e) => setCriarForm({ ...criarForm, email: e.target.value })} required />
          </div>
          <div>
            <label className="label">Senha inicial *</label>
            <input className="input" type="text" minLength={6} value={criarForm.senha} onChange={(e) => setCriarForm({ ...criarForm, senha: e.target.value })} required />
            <p className="text-xs text-slate-400 mt-1">Mín. 6 caracteres. Passe essa senha para o usuário no primeiro acesso.</p>
          </div>
          <div>
            <label className="label">Perfil</label>
            <select className="input" value={criarForm.role} onChange={(e) => setCriarForm({ ...criarForm, role: e.target.value })}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {roleLabel[r]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Empresas que pode acessar</label>
            <div className="space-y-1.5">
              {empresas.map((e) => (
                <label key={e.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={criarForm.empresaIds.includes(e.id)}
                    onChange={() => toggleEmpresaCriar(e.id)}
                  />
                  <span className="inline-block w-2 h-2 rounded-full" style={{ background: e.cor }} />
                  {e.nome}
                </label>
              ))}
            </div>
            {criarForm.role !== "ADMIN" && criarForm.empresaIds.length === 0 && (
              <p className="text-xs text-amber-600 mt-2">Sem empresas selecionadas — o usuário não verá nenhum dado.</p>
            )}
          </div>
          {criarErro && <div className="text-sm text-red-600">{criarErro}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setOpenCriar(false)}>
              Cancelar
            </button>
            <button className="btn-primary" disabled={criarSalvando}>
              {criarSalvando ? "Criando..." : "Criar usuário"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={open} onClose={() => setOpen(false)} title={editando ? `Permissões — ${editando.nome}` : ""}>
        <form onSubmit={salvar} className="space-y-3">
          <div>
            <label className="label">Perfil</label>
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {roleLabel[r]}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">
              Admin tem acesso a todas as empresas. Gerente/Colaborador veem apenas as marcadas abaixo.
            </p>
          </div>

          <div>
            <label className="label">Empresas que pode acessar</label>
            <div className="space-y-1.5">
              {empresas.map((e) => (
                <label key={e.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.empresaIds.includes(e.id)}
                    onChange={() => toggleEmpresa(e.id)}
                  />
                  <span className="inline-block w-2 h-2 rounded-full" style={{ background: e.cor }} />
                  {e.nome}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} />
              Usuário ativo (pode fazer login)
            </label>
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
