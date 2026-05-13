"use client";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    const res = await signIn("credentials", { email, senha, redirect: false });
    setLoading(false);
    if (res?.error) {
      setErro("Email ou senha inválidos.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="card w-full max-w-md p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-brand-700">AVB HUB</h1>
          <p className="text-sm text-slate-500">Gestão de projetos do grupo</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </div>
          <div>
            <label className="label">Senha</label>
            <input className="input" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
          </div>
          {erro && <div className="text-sm text-red-600">{erro}</div>}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <p className="text-sm text-slate-500 text-center mt-6">
          Não tem conta?{" "}
          <Link href="/cadastro" className="text-brand-600 font-medium hover:underline">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}
