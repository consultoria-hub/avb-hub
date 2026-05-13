import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions, getEmpresasDoUsuario } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const empresas = await getEmpresasDoUsuario(session.user.id, session.user.role);

  return (
    <div className="min-h-screen flex">
      <Sidebar
        user={{ nome: session.user.name || session.user.email || "", role: session.user.role }}
        empresas={empresas.map((e) => ({ id: e.id, nome: e.nome, cor: e.cor }))}
      />
      <main className="flex-1 p-6 md:p-8 overflow-x-hidden">{children}</main>
    </div>
  );
}
