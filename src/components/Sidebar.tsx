"use client";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Empresa = { id: string; nome: string; cor: string };

export default function Sidebar({
  user,
  empresas,
}: {
  user: { nome: string; role: "ADMIN" | "GERENTE" | "COLABORADOR" };
  empresas: Empresa[];
}) {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: "■" },
    { href: "/projetos", label: "Projetos", icon: "▤" },
    { href: "/clientes", label: "Clientes", icon: "◉" },
  ];
  if (user.role === "ADMIN") {
    links.push({ href: "/usuarios", label: "Usuários", icon: "♟" });
    links.push({ href: "/empresas", label: "Empresas", icon: "▣" });
  }

  return (
    <aside className="w-64 bg-brand-900 text-slate-100 flex flex-col">
      <div className="px-5 py-5 border-b border-white/10">
        <div className="text-lg font-bold tracking-wide">AVB HUB</div>
        <div className="text-[11px] text-slate-300">Gestão do grupo</div>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-1">
        {links.map((l) => {
          const active = pathname === l.href || pathname.startsWith(l.href + "/");
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition ${
                active ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="w-4 text-center text-slate-400">{l.icon}</span>
              {l.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-white/10">
        <div className="text-[11px] uppercase text-slate-400 px-2 mb-2">Suas empresas</div>
        <ul className="space-y-1 mb-3">
          {empresas.length === 0 && (
            <li className="text-xs text-slate-400 px-2">Sem empresas atribuídas.</li>
          )}
          {empresas.map((e) => (
            <li key={e.id} className="flex items-center gap-2 px-2 py-1 text-xs text-slate-200">
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: e.cor }} />
              {e.nome}
            </li>
          ))}
        </ul>

        <div className="px-2 py-2 rounded-md bg-white/5">
          <div className="text-sm font-medium truncate">{user.nome}</div>
          <div className="text-[11px] text-slate-400 mb-2">{user.role}</div>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-xs text-slate-300 hover:text-white">
            Sair
          </button>
        </div>
      </div>
    </aside>
  );
}
