import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const dbUrl = `file:${path.resolve(process.cwd(), "prisma/dev.db")}`;
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

async function main() {
  const sellers = await Promise.all([
    prisma.seller.upsert({
      where: { whatsapp: "11991110001" },
      update: {},
      create: {
        name: "Carlos Oliveira",
        whatsapp: "11991110001",
        email: "carlos@exemplo.com",
        sellerCode: "VND1001",
      },
    }),
    prisma.seller.upsert({
      where: { whatsapp: "11991110002" },
      update: {},
      create: {
        name: "Ana Souza",
        whatsapp: "11991110002",
        email: "ana@exemplo.com",
        sellerCode: "VND1002",
      },
    }),
    prisma.seller.upsert({
      where: { whatsapp: "11991110003" },
      update: {},
      create: {
        name: "Roberto Lima",
        whatsapp: "11991110003",
        sellerCode: "VND1003",
      },
    }),
  ]);

  const now = new Date();
  const products = [
    "Sucata de ferro",
    "Sucata de cobre",
    "Alumínio velho",
    "Papelão",
    "Ferro fundido",
    "Aço inox",
    "Chumbo",
    "Bronze",
  ];
  const customers = [
    "José Ferreira",
    "Maria Santos",
    "Pedro Alves",
    "Lucia Costa",
    "Fernando Neto",
    "Beatriz Cruz",
  ];
  const statuses = ["completed", "completed", "completed", "pending", "cancelled"];

  for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
    const salesCount = 5 + Math.floor(Math.random() * 8);
    for (let i = 0; i < salesCount; i++) {
      const seller = sellers[Math.floor(Math.random() * sellers.length)];
      const saleDate = new Date(
        now.getFullYear(),
        now.getMonth() - monthOffset,
        1 + Math.floor(Math.random() * 27)
      );
      await prisma.sale.create({
        data: {
          sellerId: seller.id,
          customerName: customers[Math.floor(Math.random() * customers.length)],
          customerPhone: `119${Math.floor(10000000 + Math.random() * 89999999)}`,
          product: products[Math.floor(Math.random() * products.length)],
          amount: Math.round((50 + Math.random() * 2000) * 100) / 100,
          status: statuses[Math.floor(Math.random() * statuses.length)],
          saleDate,
        },
      });
    }
  }

  console.log("Seed concluído com sucesso!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
