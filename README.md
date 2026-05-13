# AVB HUB

Sistema interno de gestão de projetos para o grupo:
- **AVB Gestão** — consultoria geral
- **Dunas Health** — consultoria para área da saúde
- **Amazonia Marcas e Patentes** — registro e proteção de marca

## Funcionalidades

- Login e cadastro de usuários (NextAuth com credenciais)
- 3 perfis: **Administrador**, **Gerente** e **Colaborador**
- Admin define quais empresas cada usuário pode acessar
- CRUD de **Clientes** por empresa
- CRUD de **Projetos** com:
  - Empresa, cliente, responsável e prazo
  - Tag por área: **Financeiro**, **Estratégico**, **Pessoas**, **Comercial**
  - Visualização em **Kanban** e **Lista**
- CRUD de **Tarefas** dentro de cada projeto (mesma estrutura de tags, status, prazo e responsável)
- Dashboard com totais e próximas tarefas
- Destaque automático de itens **atrasados**

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS
- Prisma + **Postgres** (Vercel Postgres, Neon, Supabase ou local)
- NextAuth (estratégia JWT)
- bcryptjs + zod

## Como rodar

Requer **Node.js 20+**.

```powershell
cd "C:\Users\mathe\OneDrive\Desktop\Projetos Tech\avb-hub"
npm install
npm run setup     # cria o banco SQLite e popula seed (empresas + admin)
npm run dev
```

Abra http://localhost:3000

### Credenciais do admin (criado pelo seed)

- **Email:** `consultoria@avbgestao.com`
- **Senha:** `AVBhub@2025`

> Troque a senha em produção. Em desenvolvimento ela vem no script de seed (`prisma/seed.ts`).

### Comandos úteis

```powershell
npm run dev          # servidor dev
npm run build        # build de produção
npm run start        # roda build de produção
npm run db:push      # aplica schema.prisma no banco
npm run db:seed      # roda seed
npm run db:studio    # interface visual do Prisma
```

## Fluxo de uso

1. Faça login com o admin.
2. Em **Empresas** confira que as três do grupo já estão cadastradas.
3. Em **Usuários** edite cada usuário cadastrado pela tela de **/cadastro** para:
   - definir o perfil (Admin / Gerente / Colaborador)
   - marcar quais empresas ele vê
4. Em **Clientes** cadastre os clientes de cada empresa.
5. Em **Projetos** crie projetos vinculados a um cliente, com tag de área e responsável; abra um projeto para gerenciar **Tarefas**.

## Estrutura

```
prisma/
  schema.prisma     # modelos
  seed.ts           # cria empresas + admin
src/
  app/
    (app)/          # rotas autenticadas (sidebar + layout)
      dashboard/
      projetos/
      clientes/
      usuarios/     # admin
      empresas/     # admin
    login/
    cadastro/
    api/
      auth/[...nextauth]/
      register/
      empresas/
      clientes/
      projetos/
      tarefas/
      usuarios/
  components/
    Sidebar.tsx
    Modal.tsx
  lib/
    prisma.ts
    auth.ts
    permissions.ts
    labels.ts
```

## Deploy na Vercel (URL pública)

1. Vá em https://vercel.com/new
2. **Import Git Repository** → escolha `consultoria-hub/avb-hub`
3. Antes de clicar **Deploy**, na seção **Storage** (ou após o 1º deploy em **Storage → Create Database**), crie um **Postgres** — a Vercel preenche `DATABASE_URL` automaticamente.
4. Em **Environment Variables**, adicione:
   - `NEXTAUTH_SECRET` = uma string aleatória longa (gere com `openssl rand -base64 32`)
   - `NEXTAUTH_URL` = a URL pública que a Vercel der (ex: `https://avb-hub.vercel.app`)
5. Clique em **Deploy**. O `vercel-build` roda `prisma db push` + seed + `next build` automaticamente.

Pronto — qualquer pessoa do grupo acessa pela URL pública.
