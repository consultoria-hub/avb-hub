import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: "ADMIN" | "GERENTE" | "COLABORADOR";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "GERENTE" | "COLABORADOR";
  }
}
