"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

/* ─────────────────────────────────────────────
   VALIDACIÓN ZOD — ALINEADA A PRISMA
   ───────────────────────────────────────────── */

const productSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  costo: z.number().positive(),

  barcode: z.string().optional(),
  categoryId: z.string(),
  color: z.string(),

  // stock inicial que usamos para poblar ProductStock / VariantStock
  stock: z.number().int().min(0),
  image: z.string().optional(),

  variants: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string(),
        value: z.string(),
        priceAdjustment: z.number(),
      })
    )
    .optional(),
})

export type ProductInput = z.infer<typeof productSchema>

/* ─────────────────────────────────────────────
   CREATE PRODUCT (CON STOCK POR SUCURSAL)
   ───────────────────────────────────────────── */

export async function createProduct(data: ProductInput) {
  const validated = productSchema.parse(data)

  // Traemos todas las sucursales para poblar ProductStock / VariantStock
  const branches = await prisma.branch.findMany()

  // 1️⃣ Crear el producto (sin stock: el stock está en ProductStock)
  const created = await prisma.product.create({
    data: {
      name: validated.name,
      price: validated.price,
      costo: validated.costo,
      barcode: validated.barcode || null,
      categoryId: validated.categoryId,
      color: validated.color,
      image: validated.image || null,
      active: true,

      variants: {
        create:
          validated.variants?.map((v) => ({
            name: v.name,
            value: v.value,
            priceAdjustment: v.priceAdjustment,
          })) ?? [],
      },
    },
    include: {
      variants: true,
      category: true,
    },
  })

  // 2️⃣ Stock por sucursal para el producto
  await prisma.productStock.createMany({
    data: branches.map((b) => ({
      productId: created.id,
      branchId: b.id,
      stock: validated.stock,
    })),
  })

  // 3️⃣ Stock por sucursal para cada variante (si hay)
  if (created.variants.length > 0) {
    const variantStockData = created.variants.flatMap((variant) =>
      branches.map((b) => ({
        variantId: variant.id,
        branchId: b.id,
        stock: validated.stock,
      }))
    )

    await prisma.variantStock.createMany({
      data: variantStockData,
    })
  }

  revalidatePath("/admin/productos")
  return created
}

/* ─────────────────────────────────────────────
   UPDATE PRODUCT — CON REGENERACIÓN DE STOCK DE VARIANTES
   ───────────────────────────────────────────── */

export async function updateProduct(id: string, data: ProductInput) {
  const validated = productSchema.parse(data)

  const branches = await prisma.branch.findMany()

  // 1️⃣ Eliminar stocks de variantes anteriores
  await prisma.variantStock.deleteMany({
    where: { variant: { productId: id } },
  })

  // 2️⃣ Eliminar variantes actuales
  await prisma.productVariant.deleteMany({
    where: { productId: id },
  })

  // 3️⃣ Actualizar producto (tampoco acá tocamos ProductStock)
  const updated = await prisma.product.update({
    where: { id },
    data: {
      name: validated.name,
      price: validated.price,
      costo: validated.costo,
      barcode: validated.barcode || null,
      categoryId: validated.categoryId,
      color: validated.color,
      image: validated.image || null,

      variants: {
        create:
          validated.variants?.map((v) => ({
            name: v.name,
            value: v.value,
            priceAdjustment: v.priceAdjustment,
          })) ?? [],
      },
    },
    include: {
      variants: true,
      category: true,
    },
  })

  // 4️⃣ Asegurar que exista ProductStock por sucursal (no lo pisamos)
  for (const branch of branches) {
    const exists = await prisma.productStock.findFirst({
      where: { productId: id, branchId: branch.id },
    })

    if (!exists) {
      await prisma.productStock.create({
        data: {
          productId: id,
          branchId: branch.id,
          stock: validated.stock,
        },
      })
    }
  }

  // 5️⃣ Regenerar VariantStock con las nuevas variantes
  if (updated.variants.length > 0) {
    const variantStockData = updated.variants.flatMap((variant) =>
      branches.map((b) => ({
        variantId: variant.id,
        branchId: b.id,
        stock: validated.stock,
      }))
    )

    await prisma.variantStock.createMany({
      data: variantStockData,
    })
  }

  revalidatePath("/admin/productos")
  return updated
}

/* ─────────────────────────────────────────────
   RESTORE PRODUCT (SOFT RESTORE)
   ───────────────────────────────────────────── */

export async function restoreProduct(id: string) {
  await prisma.product.update({
    where: { id },
    data: { active: true },
  })

  revalidatePath("/admin/productos")
}

/* ─────────────────────────────────────────────
   DELETE PRODUCT (SOFT DELETE)
   ───────────────────────────────────────────── */

export async function deleteProduct(id: string) {
  await prisma.product.update({
    where: { id },
    data: { active: false },
  })

  revalidatePath("/admin/productos")
}
