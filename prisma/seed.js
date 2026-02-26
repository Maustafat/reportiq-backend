import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...\n");

  // Create test user
  const hash = await bcrypt.hash("password123", 12);
  const user = await prisma.user.upsert({
    where: { email: "test@reportiq.it" },
    update: {},
    create: {
      email: "test@reportiq.it",
      password: hash,
      name: "Mario Rossi",
    },
  });
  console.log(`✅ User: ${user.email} (password: password123)`);

  // Create a sample completed order
  const order = await prisma.order.create({
    data: {
      userId: user.id,
      status: "completed",
      total: 10980,
      items: {
        create: [
          {
            companyId: "1",
            companyName: "TechnoVerde S.r.l.",
            companyPiva: "IT02345678901",
            reportType: "financial",
            reportName: "Report Finanziario",
            price: 7990,
          },
          {
            companyId: "3",
            companyName: "Alimentari del Sud S.r.l.",
            companyPiva: "IT03456789012",
            reportType: "base",
            reportName: "Report Base",
            price: 2990,
          },
        ],
      },
    },
  });
  console.log(`✅ Sample order: ${order.id} (€${(order.total / 100).toFixed(2)})`);

  console.log("\n🎉 Seed complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
