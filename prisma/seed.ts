import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const empresas = [
    { nome: "AVB Gestão", slug: "avb-gestao", cor: "#1d4ed8" },
    { nome: "Dunas Health", slug: "dunas-health", cor: "#0d9488" },
    { nome: "Amazonia Marcas e Patentes", slug: "amazonia", cor: "#16a34a" },
  ];

  for (const e of empresas) {
    await prisma.empresa.upsert({
      where: { slug: e.slug },
      update: { nome: e.nome, cor: e.cor },
      create: e,
    });
  }

  const todasEmpresas = await prisma.empresa.findMany();

  const adminEmail = "consultoria@avbgestao.com";
  const senhaTemp = "AVBhub@2025";
  const senhaHash = await bcrypt.hash(senhaTemp, 10);

  const admin = await prisma.usuario.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      nome: "Administrador AVB",
      email: adminEmail,
      senhaHash,
      role: "ADMIN",
    },
  });

  for (const emp of todasEmpresas) {
    await prisma.usuarioEmpresa.upsert({
      where: {
        usuarioId_empresaId: { usuarioId: admin.id, empresaId: emp.id },
      },
      update: {},
      create: { usuarioId: admin.id, empresaId: emp.id },
    });
  }

  console.log("\n=== AVB HUB — Seed concluído ===");
  console.log("Empresas:", todasEmpresas.map((e) => e.nome).join(", "));
  console.log(`Admin: ${adminEmail}`);
  console.log(`Senha temporária: ${senhaTemp}`);
  console.log("================================\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
