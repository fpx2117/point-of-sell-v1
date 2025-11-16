"use server"

import { MovementType } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

/* ----------------------------------------------------------
   🧾 Validación
---------------------------------------------------------- */
const inventorySchema = z.object({
  productId: z.string(),
  variantId: z.string().nullable().optional(), // variante opcional
  type: z.enum(["ENTRADA", "SALIDA", "AJUSTE"]),
  quantity: z.number().int().positive(),
  reason: z.string().min(1),
})

export async function adjustInventory(data: z.infer<typeof inventorySchema>) {
  const validated = inventorySchema.parse(data)
  const session = await getServerSession(authOptions)

  if (!session) throw new Error("No autorizado")

  /* ----------------------------------------------------------
     🏪 Obtener sucursal del usuario
  ---------------------------------------------------------- */
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { branchId: true },
  })

  if (!user?.branchId)
    throw new Error("El usuario no tiene sucursal asignada.")

  const branchId = user.branchId

  /* ----------------------------------------------------------
     🔎 Buscar producto
  ---------------------------------------------------------- */
  const product = await prisma.product.findUnique({
    where: { id: validated.productId },
    include: { variants: true },
  })

  if (!product) throw new Error("Producto no encontrado")

  const isVariantOperation = !!validated.variantId

  /* ==========================================================
     🟣 CASO A: AJUSTE SOBRE UNA VARIANTE
     ========================================================== */
  if (isVariantOperation) {
    const variantId = validated.variantId!

    // validar que la variante pertenece al producto
    const variant = product.variants.find((v) => v.id === variantId)
    if (!variant) throw new Error("La variante no pertenece al producto")

    // buscar stock por sucursal
    let variantStock = await prisma.variantStock.findFirst({
      where: { variantId, branchId },
    })

    // si no existe, crear con stock 0
    if (!variantStock) {
      variantStock = await prisma.variantStock.create({
        data: { variantId, branchId, stock: 0 },
      })
    }

    let newStock = variantStock.stock

    if (validated.type === "ENTRADA") newStock += validated.quantity
    else if (validated.type === "SALIDA") newStock -= validated.quantity
    else if (validated.type === "AJUSTE") newStock = validated.quantity

    if (newStock < 0)
      throw new Error("Stock insuficiente para esta variante.")

    /* ----------------------------------------------------------
       💾 Transacción
    ---------------------------------------------------------- */
    await prisma.$transaction([
      prisma.variantStock.update({
        where: { id: variantStock.id },
        data: { stock: newStock },
      }),

      prisma.inventoryMovement.create({
        data: {
          productId: validated.productId,
          variantId, // ✅ AHORA SÍ SE GUARDA
          type: validated.type as MovementType,
          quantity: validated.quantity,
          reason: validated.reason + " (Variante)",
          userId: session.user.id,
          branchId,
        },
      }),
    ])

    revalidatePath("/admin/inventario")
    return
  }

  /* ==========================================================
     🟢 CASO B: PRODUCTO SIN VARIANTES
     ========================================================== */

  // buscar stock individual del producto por sucursal
  let productStock = await prisma.productStock.findFirst({
    where: { productId: validated.productId, branchId },
  })

  // si no existe, crearlo
  if (!productStock) {
    productStock = await prisma.productStock.create({
      data: {
        productId: validated.productId,
        branchId,
        stock: 0,
      },
    })
  }

  let newStock = productStock.stock

  if (validated.type === "ENTRADA") newStock += validated.quantity
  else if (validated.type === "SALIDA") newStock -= validated.quantity
  else if (validated.type === "AJUSTE") newStock = validated.quantity

  if (newStock < 0) throw new Error("Stock insuficiente.")

  /* ----------------------------------------------------------
     💾 Transacción
  ---------------------------------------------------------- */
  await prisma.$transaction([
    prisma.productStock.update({
      where: { id: productStock.id },
      data: { stock: newStock },
    }),

    prisma.inventoryMovement.create({
      data: {
        productId: validated.productId,
        variantId: null, // ❗ producto sin variantes
        type: validated.type as MovementType,
        quantity: validated.quantity,
        reason: validated.reason,
        userId: session.user.id,
        branchId,
      },
    }),
  ])

  revalidatePath("/admin/inventario")
}
