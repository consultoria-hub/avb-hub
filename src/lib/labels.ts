export const TAGS = ["FINANCEIRO", "ESTRATEGICO", "PESSOAS", "COMERCIAL"] as const;
export type Tag = (typeof TAGS)[number];

export const STATUSES = ["A_FAZER", "EM_ANDAMENTO", "EM_REVISAO", "CONCLUIDO"] as const;
export type Status = (typeof STATUSES)[number];

export const ROLES = ["ADMIN", "GERENTE", "COLABORADOR"] as const;
export type Role = (typeof ROLES)[number];

export const tagLabel: Record<Tag, string> = {
  FINANCEIRO: "Financeiro",
  ESTRATEGICO: "Estratégico",
  PESSOAS: "Pessoas",
  COMERCIAL: "Comercial",
};

export const tagClass: Record<Tag, string> = {
  FINANCEIRO: "tag-financeiro",
  ESTRATEGICO: "tag-estrategico",
  PESSOAS: "tag-pessoas",
  COMERCIAL: "tag-comercial",
};

export const statusLabel: Record<Status, string> = {
  A_FAZER: "A fazer",
  EM_ANDAMENTO: "Em andamento",
  EM_REVISAO: "Em revisão",
  CONCLUIDO: "Concluído",
};

export const roleLabel: Record<Role, string> = {
  ADMIN: "Administrador",
  GERENTE: "Gerente",
  COLABORADOR: "Colaborador",
};

export function formatDate(d: string | Date | null | undefined) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("pt-BR");
}

export function isAtrasado(prazo: string | Date | null | undefined, status: string) {
  if (!prazo || status === "CONCLUIDO") return false;
  return new Date(prazo).getTime() < Date.now();
}
