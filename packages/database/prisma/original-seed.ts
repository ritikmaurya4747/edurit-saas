import { PrismaClient, Role, Plan } from "@prisma/client";
import { randomBytes, scryptSync } from "crypto";

const prisma = new PrismaClient();

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  const school = await prisma.school.upsert({
    where: { subdomain: "demo" },
    update: {},
    create: {
      name: "Demo Public School",
      subdomain: "demo",
      plan: Plan.PRO,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { schoolId_email: { schoolId: school.id, email: "principal@demo.com" } },
    update: {},
    create: {
      schoolId: school.id,
      email: "principal@demo.com",
      passwordHash: hashPassword("Password123!"),
      fullName: "Demo Principal",
      role: Role.SUPERADMIN,
    },
  });

  console.log("Seeded school:", school.subdomain);
  console.log("Login: principal@demo.com / Password123!");
  console.log("Access via: http://demo.localhost:3000");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
