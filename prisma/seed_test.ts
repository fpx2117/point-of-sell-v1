import {
  PrismaClient,
  UserRole,
  PaymentMethod,
  MovementType,
} from "@prisma/client"
import { hashSync } from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Iniciando seed...")

  /* ============================================
     1️⃣ USUARIOS
  ============================================ */
  const admin = await prisma.user.upsert({
    where: { email: "admin@admin.com" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@admin.com",
      password: hashSync("1234", 10),
      role: UserRole.ADMIN,
    },
  })

  const vendedor = await prisma.user.upsert({
    where: { email: "vendedor@local.com" },
    update: {},
    create: {
      name: "Vendedor",
      email: "vendedor@local.com",
      password: hashSync("1234", 10),
      role: UserRole.VENDEDOR,
    },
  })

  /* ============================================
     2️⃣ SUCURSAL
  ============================================ */
  const branch = await prisma.branch.upsert({
    where: { name: "Sucursal Principal" },
    update: {},
    create: {
      name: "Sucursal Principal",
      address: "Av. Principal 123",
    },
  })

  /* ============================================
     3️⃣ CATEGORÍAS
  ============================================ */
  await prisma.category.createMany({
    data: [
      { name: "Alcohol", color: "#7f1d1d" },
      { name: "Energéticas", color: "#1e40af" },
      { name: "Snacks", color: "#f59e0b" },
    ],
    skipDuplicates: true,
  })

  const alcohol = await prisma.category.findFirst({
    where: { name: "Alcohol" },
  })

  /* ============================================
     4️⃣ PRODUCTO: VODKA SKY CON VARIANTES (SABORES)
       → stock por variante, NO global
  ============================================ */
  const vodkaSky = await prisma.product.create({
    data: {
      name: "Vodka Sky 750ml",
      price: 8200,
      costo: 6000,
      barcode: "779999000001",
      color: "#1d4ed8",
      categoryId: alcohol!.id,
      active: true,

      variants: {
        create: [
          { name: "Sabor", value: "Clásico", priceAdjustment: 0 },
          { name: "Sabor", value: "Frutilla", priceAdjustment: 200 },
          { name: "Sabor", value: "Durazno", priceAdjustment: 200 },
        ],
      },
    },
    include: { variants: true },
  })

  /* ============================================
     5️⃣ STOCK POR VARIANTE
     (VariantStock)
  ============================================ */

  const variantStocks = [
    { value: "Clásico", stock: 20 },
    { value: "Frutilla", stock: 15 },
    { value: "Durazno", stock: 10 },
  ]

  for (const vs of variantStocks) {
    const variant = vodkaSky.variants.find((v) => v.value === vs.value)!

    await prisma.variantStock.create({
      data: {
        variantId: variant.id,
        branchId: branch.id,
        stock: vs.stock,
      },
    })
  }

  /* ============================================
     6️⃣ OTROS PRODUCTOS (EJEMPLO ALCOHOL)
     → sin variantes
     → stock en ProductStock
  ============================================ */

  const ron = await prisma.product.create({
    data: {
      name: "Ron Havana Club 750ml",
      price: 9500,
      costo: 6900,
      barcode: "779999000002",
      color: "#166534",
      categoryId: alcohol!.id,
      active: true,
    },
  })

  await prisma.productStock.create({
    data: {
      productId: ron.id,
      branchId: branch.id,
      stock: 25,
    },
  })

  const whisky = await prisma.product.create({
    data: {
      name: "Whisky Red Label 750ml",
      price: 12500,
      costo: 9000,
      barcode: "779999000003",
      color: "#b45309",
      categoryId: alcohol!.id,
      active: true,
    },
  })

  await prisma.productStock.create({
    data: {
      productId: whisky.id,
      branchId: branch.id,
      stock: 12,
    },
  })

  /* ============================================
     7️⃣ VENTA EJEMPLO
     ❗ SIN variantId (tu modelo NO lo soporta)
  ============================================ */

  await prisma.sale.create({
    data: {
      userId: vendedor.id,
      branchId: branch.id,
      total: 8200,
      paymentMethod: PaymentMethod.EFECTIVO,
      cashAmount: 10000,
      change: 1800,
      items: {
        create: [
          {
            productId: vodkaSky.id,
            quantity: 1,
            price: 8200,
            subtotal: 8200,
          },
        ],
      },
    },
  })

  console.log("✅ Seed completado correctamente")
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e)
    process.exit(1)
  })
  .finally(async () => prisma.$disconnect())
