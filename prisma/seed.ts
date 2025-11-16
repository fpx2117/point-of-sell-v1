import { PrismaClient, UserRole } from "@prisma/client"
import { hashSync } from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Iniciando seed solo de usuarios...")

  /* ============================================
     1️⃣ USUARIOS (ÚNICOS REQUERIDOS)
  ============================================ */

  await prisma.user.upsert({
    where: { email: "franco@admin.com" },
    update: {},
    create: {
      name: "Franco Salas",
      email: "franco@admin.com",
      password: hashSync("23743754", 10),
      role: UserRole.ADMIN,
    },
  })
    await prisma.user.upsert({
    where: { email: "diego@admin.com" },
    update: {},
    create: {
      name: "Diego Vasconcel",
      email: "diego@admin.com",
      password: hashSync("fvS9f3yq21@", 10),
      role: UserRole.ADMIN,
    },
  })

  await prisma.user.upsert({
    where: { email: "francosalas12@gmail.com" },
    update: {},
    create: {
      name: "Franco Salas - Hooka",
      email: "francosalas12@gmail.com",
      password: hashSync("23743754", 10),
      role: UserRole.VENDEDOR,
    },
  })

  console.log("✅ Seed completado: solo usuarios creados")
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e)
    process.exit(1)
  })
  .finally(async () => prisma.$disconnect())
