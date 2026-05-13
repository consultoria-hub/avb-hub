"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function CadastroPage() {
  const router = useRouter();
  const [form, setForm] = useState({ nome: "", email: "", senha: "" });
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErro(data.error || "Não foi possível cadastrar.");
      return;
    }
    router.push("/login?cadastrado=1");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="card w-full max-w-md p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-brand-700">AVB HUB</h1>
          <p className="text-sm text-slate-500">Criar conta</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">Nome completo</label>
            <input className="input" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required autoFocus />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <label className="label">Senha</label>
            <input className="input" type="password" minLength={6} value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} required />
            <p className="text-xs text-slate-400 mt-1">Mínimo 6 caracteres.</p>
          </div>
          {erro && <div className="text-sm text-red-600">{erro}</div>}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Criando..." : "Criar conta"}
          </button>
        </form>
        <p className="text-xs text-slate-400 text-center mt-4">
          Novas contas entram como <b>Colaborador</b> sem empresa atribuída. O administrador concede os acessos.
        </p>
        <p className="text-sm text-slate-500 text-center mt-4">
          Já tem conta?{" "}
          <Link href="/login" className="text-brand-600 font-medium hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
